package main

import (
	"bytes"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestHubNativeFlowPairingAuthSequenceAndTLS(t *testing.T) {
	tmpDir := t.TempDir()
	hub, err := newHubServer(tmpDir)
	if err != nil {
		t.Fatalf("newHubServer failed: %v", err)
	}

	// 1. Before pairing: /api/health returns paired=false, /api/sync/state returns 401
	reqHealth := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	recHealth := httptest.NewRecorder()
	hub.ServeHTTP(recHealth, reqHealth)
	if recHealth.Code != http.StatusOK {
		t.Fatalf("expected 200 from /api/health, got %d", recHealth.Code)
	}
	var healthBody map[string]any
	_ = json.Unmarshal(recHealth.Body.Bytes(), &healthBody)
	if paired, _ := healthBody["paired"].(bool); paired {
		t.Fatalf("expected paired=false initially")
	}

	reqUnauth := httptest.NewRequest(http.MethodGet, "/api/sync/state", nil)
	recUnauth := httptest.NewRecorder()
	hub.ServeHTTP(recUnauth, reqUnauth)
	if recUnauth.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 from unauth /api/sync/state, got %d", recUnauth.Code)
	}

	// 2. Non-localhost /api/pair must be rejected (403 Forbidden)
	pairPayload := `{"tenantId":"t-1","companyName":"Loja Teste","token":"tok_abc"}`
	reqRemotePair := httptest.NewRequest(http.MethodPost, "/api/pair", bytes.NewBufferString(pairPayload))
	reqRemotePair.RemoteAddr = "192.168.1.44:54321"
	recRemotePair := httptest.NewRecorder()
	hub.ServeHTTP(recRemotePair, reqRemotePair)
	if recRemotePair.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for remote /api/pair, got %d", recRemotePair.Code)
	}

	// 3. Localhost /api/pair succeeds and persists hub-config.json
	reqLocalPair := httptest.NewRequest(http.MethodPost, "/api/pair", bytes.NewBufferString(pairPayload))
	reqLocalPair.RemoteAddr = "127.0.0.1:54321"
	recLocalPair := httptest.NewRecorder()
	hub.ServeHTTP(recLocalPair, reqLocalPair)
	if recLocalPair.Code != http.StatusOK {
		t.Fatalf("expected 200 for local /api/pair, got %d (%s)", recLocalPair.Code, recLocalPair.Body.String())
	}

	// 4. Reserve sequential order numbers without collision
	reserve := func() string {
		req := httptest.NewRequest(http.MethodPost, "/api/sync/reserve-order-number", bytes.NewBufferString(`{"year":2026}`))
		req.Header.Set("X-AgilOS-Token", "tok_abc")
		rec := httptest.NewRecorder()
		hub.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 reserve, got %d", rec.Code)
		}
		var out map[string]any
		_ = json.Unmarshal(rec.Body.Bytes(), &out)
		return out["orderNumber"].(string)
	}
	if n1, n2 := reserve(), reserve(); n1 != "2026-000001" || n2 != "2026-000002" {
		t.Fatalf("unexpected sequence numbers: %s, %s", n1, n2)
	}

	// 5. Mutate + deduplicate + read state
	mutBody := `{
	  "terminalId":"balcao-1",
	  "terminalLabel":"Balcão 1",
	  "mutation":{"id":"mut-1","table":"service_orders","action":"INSERT","payload":{"id":"os-1","order_number":"2026-000002"}},
	  "entitySnapshot":{"serviceOrder":{"id":"os-1","tenant_id":"t-1","order_number":"2026-000002","order_sequence":2,"order_year":2026}}
	}`
	reqMut := httptest.NewRequest(http.MethodPost, "/api/sync/mutate", bytes.NewBufferString(mutBody))
	reqMut.Header.Set("X-AgilOS-Token", "tok_abc")
	recMut := httptest.NewRecorder()
	hub.ServeHTTP(recMut, reqMut)
	if recMut.Code != http.StatusOK {
		t.Fatalf("expected 200 mutate, got %d", recMut.Code)
	}

	reqDup := httptest.NewRequest(http.MethodPost, "/api/sync/mutate", bytes.NewBufferString(mutBody))
	reqDup.Header.Set("X-AgilOS-Token", "tok_abc")
	recDup := httptest.NewRecorder()
	hub.ServeHTTP(recDup, reqDup)
	var dupOut map[string]any
	_ = json.Unmarshal(recDup.Body.Bytes(), &dupOut)
	if dedup, _ := dupOut["deduplicated"].(bool); !dedup {
		t.Fatalf("expected duplicate mutation to return deduplicated=true")
	}

	// 6. Native HTTPS certificate generation validation
	if _, err := ensureSelfSignedCert(tmpDir); err != nil {
		t.Fatalf("ensureSelfSignedCert failed: %v", err)
	}
	certBytes, err := os.ReadFile(filepath.Join(tmpDir, "hub-cert.pem"))
	if err != nil {
		t.Fatalf("missing hub-cert.pem: %v", err)
	}
	block, _ := pem.Decode(certBytes)
	parsedCert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		t.Fatalf("ParseCertificate failed: %v", err)
	}
	if err := parsedCert.VerifyHostname("localhost"); err != nil {
		t.Fatalf("cert failed localhost SAN check: %v", err)
	}
	if err := parsedCert.VerifyHostname("127.0.0.1"); err != nil {
		t.Fatalf("cert failed 127.0.0.1 SAN check: %v", err)
	}
}
