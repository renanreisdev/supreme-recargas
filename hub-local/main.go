package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"html"
	"io"
	"log"
	"math/big"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
)

const appVersion = "1.0.0"

type HubConfig struct {
	TenantID    string `json:"tenantId"`
	CompanyName string `json:"companyName"`
	Token       string `json:"token"`
	Port        int    `json:"port"`
	HTTPSPort   int    `json:"httpsPort"`
	PairedAt    string `json:"pairedAt,omitempty"`
}

type SnapshotData struct {
	ServiceOrders []map[string]any `json:"serviceOrders"`
	Customers     []map[string]any `json:"customers"`
	Payments      []map[string]any `json:"payments"`
	CashRegisters []map[string]any `json:"cashRegisters"`
}

type MutationEvent struct {
	Revision       int            `json:"revision"`
	Mutation       map[string]any `json:"mutation"`
	EntitySnapshot map[string]any `json:"entitySnapshot,omitempty"`
	TerminalID     string         `json:"terminalId"`
	TerminalLabel  string         `json:"terminalLabel"`
	ReceivedAt     string         `json:"receivedAt"`
}

type HubState struct {
	TenantID          string          `json:"tenantId"`
	CompanyName       string          `json:"companyName"`
	Revision          int             `json:"revision"`
	LastOrderYear     int             `json:"lastOrderYear"`
	LastOrderSequence int             `json:"lastOrderSequence"`
	UpdatedAt         string          `json:"updatedAt"`
	SeenMutationIDs   []string        `json:"seenMutationIds"`
	RecentMutations   []MutationEvent `json:"recentMutations"`
	Snapshot          SnapshotData    `json:"snapshot"`
}

type sseClient struct {
	id            string
	terminalID    string
	terminalLabel string
	connectedAt   string
	ch            chan string
}

type HubServer struct {
	mu          sync.RWMutex
	dataDir     string
	config      HubConfig
	state       HubState
	seenSet     map[string]struct{}
	clientsMu   sync.RWMutex
	clients     map[string]*sseClient
	startedAt   time.Time
	httpsReady  bool
}

func defaultDataDir() string {
	if env := strings.TrimSpace(os.Getenv("AGILOS_HUB_DATA_DIR")); env != "" {
		return env
	}
	if localAppData := strings.TrimSpace(os.Getenv("LOCALAPPDATA")); localAppData != "" {
		return filepath.Join(localAppData, "AgilOS-Hub")
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "."
	}
	return filepath.Join(home, ".agilos-hub")
}

func getEnvInt(key string, fallback int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	v, err := strconv.Atoi(raw)
	if err != nil || v <= 0 {
		return fallback
	}
	return v
}

func getLanIPv4Addresses() []string {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil
	}
	seen := make(map[string]bool)
	var ips []string
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}
			if ip == nil || ip.IsLoopback() {
				continue
			}
			v4 := ip.To4()
			if v4 == nil {
				continue
			}
			s := v4.String()
			if !seen[s] {
				seen[s] = true
				ips = append(ips, s)
			}
		}
	}
	return ips
}

func newHubServer(dataDir string) (*HubServer, error) {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return nil, err
	}

	h := &HubServer{
		dataDir:   dataDir,
		seenSet:   make(map[string]struct{}),
		clients:   make(map[string]*sseClient),
		startedAt: time.Now(),
	}

	h.loadConfig()
	h.loadState()
	return h, nil
}

func (h *HubServer) configPath() string {
	return filepath.Join(h.dataDir, "hub-config.json")
}

func (h *HubServer) statePath() string {
	return filepath.Join(h.dataDir, "hub-data.json")
}

func (h *HubServer) mutationLogPath() string {
	return filepath.Join(h.dataDir, "hub-mutations.ndjson")
}

func (h *HubServer) loadConfig() {
	cfg := HubConfig{
		CompanyName: "Agil OS",
		Port:        4321,
		HTTPSPort:   4322,
	}
	if raw, err := os.ReadFile(h.configPath()); err == nil {
		_ = json.Unmarshal(raw, &cfg)
	}
	if cfg.Port <= 0 {
		cfg.Port = 4321
	}
	if cfg.HTTPSPort <= 0 {
		cfg.HTTPSPort = cfg.Port + 1
	}
	if envPort := getEnvInt("AGILOS_HUB_PORT", 0); envPort > 0 {
		cfg.Port = envPort
	}
	if envHTTPS := getEnvInt("AGILOS_HUB_HTTPS_PORT", 0); envHTTPS > 0 {
		cfg.HTTPSPort = envHTTPS
	}
	if envTok := strings.TrimSpace(os.Getenv("AGILOS_HUB_TOKEN")); envTok != "" {
		cfg.Token = envTok
	}
	h.config = cfg
}

func writeFileAtomic(path string, data []byte) error {
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o600); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

func (h *HubServer) saveConfigLocked() error {
	raw, err := json.MarshalIndent(h.config, "", "  ")
	if err != nil {
		return err
	}
	return writeFileAtomic(h.configPath(), raw)
}

func defaultSnapshot() SnapshotData {
	return SnapshotData{
		ServiceOrders: []map[string]any{},
		Customers:     []map[string]any{},
		Payments:      []map[string]any{},
		CashRegisters: []map[string]any{},
	}
}

func (h *HubServer) loadState() {
	st := HubState{
		TenantID:      h.config.TenantID,
		CompanyName:   h.config.CompanyName,
		LastOrderYear: time.Now().Year(),
		Snapshot:      defaultSnapshot(),
	}
	if raw, err := os.ReadFile(h.statePath()); err == nil {
		if err := json.Unmarshal(raw, &st); err == nil {
			if st.Snapshot.ServiceOrders == nil {
				st.Snapshot.ServiceOrders = []map[string]any{}
			}
			if st.Snapshot.Customers == nil {
				st.Snapshot.Customers = []map[string]any{}
			}
			if st.Snapshot.Payments == nil {
				st.Snapshot.Payments = []map[string]any{}
			}
			if st.Snapshot.CashRegisters == nil {
				st.Snapshot.CashRegisters = []map[string]any{}
			}
		}
	}
	for _, id := range st.SeenMutationIDs {
		h.seenSet[id] = struct{}{}
	}
	h.state = st
}

func (h *HubServer) saveStateLocked() error {
	h.state.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	ids := make([]string, 0, len(h.seenSet))
	for id := range h.seenSet {
		ids = append(ids, id)
	}
	if len(ids) > 1000 {
		ids = ids[len(ids)-1000:]
	}
	h.state.SeenMutationIDs = ids

	raw, err := json.MarshalIndent(h.state, "", "  ")
	if err != nil {
		return err
	}
	return writeFileAtomic(h.statePath(), raw)
}

func (h *HubServer) appendMutationLog(ev MutationEvent) {
	line, err := json.Marshal(ev)
	if err != nil {
		return
	}
	f, err := os.OpenFile(h.mutationLogPath(), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return
	}
	defer f.Close()
	_, _ = f.Write(append(line, '\n'))
}

func ensureSelfSignedCert(dataDir string) (tls.Certificate, error) {
	keyPath := filepath.Join(dataDir, "hub-key.pem")
	certPath := filepath.Join(dataDir, "hub-cert.pem")

	if _, err := os.Stat(keyPath); err == nil {
		if _, err2 := os.Stat(certPath); err2 == nil {
			if cert, errLoad := tls.LoadX509KeyPair(certPath, keyPath); errLoad == nil {
				return cert, nil
			}
		}
	}

	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return tls.Certificate{}, err
	}

	serialLimit := new(big.Int).Lsh(big.NewInt(1), 96)
	serial, err := rand.Int(rand.Reader, serialLimit)
	if err != nil {
		return tls.Certificate{}, err
	}

	ipAddrs := []net.IP{net.ParseIP("127.0.0.1")}
	for _, s := range getLanIPv4Addresses() {
		if parsed := net.ParseIP(s); parsed != nil {
			ipAddrs = append(ipAddrs, parsed)
		}
	}

	tmpl := x509.Certificate{
		SerialNumber: serial,
		Subject: pkix.Name{
			CommonName:   "Agil OS LAN Hub",
			Organization: []string{"Agil OS"},
		},
		NotBefore:             time.Now().Add(-24 * time.Hour),
		NotAfter:              time.Now().Add(820 * 24 * time.Hour),
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		IsCA:                  false,
		DNSNames:              []string{"localhost"},
		IPAddresses:           ipAddrs,
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &tmpl, &tmpl, &priv.PublicKey, priv)
	if err != nil {
		return tls.Certificate{}, err
	}

	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: derBytes})
	keyDER, err := x509.MarshalPKCS8PrivateKey(priv)
	if err != nil {
		return tls.Certificate{}, err
	}
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: keyDER})

	_ = writeFileAtomic(keyPath, keyPEM)
	_ = writeFileAtomic(certPath, certPEM)

	return tls.X509KeyPair(certPEM, keyPEM)
}

func setCORSHeaders(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "" {
		origin = "*"
	}
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-AgilOS-Token, Authorization")
	w.Header().Set("Access-Control-Allow-Private-Network", "true")
}

func sendJSON(w http.ResponseWriter, r *http.Request, status int, payload any) {
	setCORSHeaders(w, r)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func extractToken(r *http.Request) string {
	if hdr := strings.TrimSpace(r.Header.Get("X-AgilOS-Token")); hdr != "" {
		return hdr
	}
	return strings.TrimSpace(r.URL.Query().Get("token"))
}

func isLoopbackRemote(remoteAddr string) bool {
	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		host = remoteAddr
	}
	host = strings.Trim(host, "[]")
	if host == "localhost" {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}

func upsertByID(list []map[string]any, incoming map[string]any) []map[string]any {
	idVal, _ := incoming["id"].(string)
	if idVal == "" {
		return list
	}
	for i, existing := range list {
		if curID, _ := existing["id"].(string); curID == idVal {
			merged := make(map[string]any, len(existing)+len(incoming))
			for k, v := range existing {
				merged[k] = v
			}
			for k, v := range incoming {
				merged[k] = v
			}
			next := make([]map[string]any, len(list))
			copy(next, list)
			next[i] = merged
			return next
		}
	}
	return append([]map[string]any{incoming}, list...)
}

func toInt(v any) int {
	switch t := v.(type) {
	case float64:
		return int(t)
	case int:
		return t
	case int64:
		return int(t)
	case json.Number:
		n, _ := t.Int64()
		return int(n)
	}
	return 0
}

func (h *HubServer) applyMutationLocked(mutation map[string]any, entitySnapshot map[string]any) {
	if entitySnapshot != nil {
		if so, ok := entitySnapshot["serviceOrder"].(map[string]any); ok {
			h.state.Snapshot.ServiceOrders = upsertByID(h.state.Snapshot.ServiceOrders, so)
			seq := toInt(so["order_sequence"])
			yr := toInt(so["order_year"])
			if yr == 0 {
				yr = time.Now().Year()
			}
			if yr > h.state.LastOrderYear {
				h.state.LastOrderYear = yr
				h.state.LastOrderSequence = seq
			} else if yr == h.state.LastOrderYear && seq > h.state.LastOrderSequence {
				h.state.LastOrderSequence = seq
			}
		}
		if cust, ok := entitySnapshot["customer"].(map[string]any); ok {
			h.state.Snapshot.Customers = upsertByID(h.state.Snapshot.Customers, cust)
		}
		if pay, ok := entitySnapshot["payment"].(map[string]any); ok {
			h.state.Snapshot.Payments = upsertByID(h.state.Snapshot.Payments, pay)
		}
		if reg, ok := entitySnapshot["cashRegister"].(map[string]any); ok {
			h.state.Snapshot.CashRegisters = upsertByID(h.state.Snapshot.CashRegisters, reg)
		}
	}

	table, _ := mutation["table"].(string)
	action, _ := mutation["action"].(string)
	matchVal, _ := mutation["matchValue"].(string)
	payload, _ := mutation["payload"].(map[string]any)

	switch table {
	case "service_orders":
		if action == "INSERT" && payload != nil {
			h.state.Snapshot.ServiceOrders = upsertByID(h.state.Snapshot.ServiceOrders, payload)
		} else if action == "UPDATE" && matchVal != "" && payload != nil {
			for i, ord := range h.state.Snapshot.ServiceOrders {
				if id, _ := ord["id"].(string); id == matchVal {
					for k, v := range payload {
						h.state.Snapshot.ServiceOrders[i][k] = v
					}
					break
				}
			}
		} else if action == "DELETE" && matchVal != "" {
			filtered := make([]map[string]any, 0, len(h.state.Snapshot.ServiceOrders))
			for _, ord := range h.state.Snapshot.ServiceOrders {
				if id, _ := ord["id"].(string); id != matchVal {
					filtered = append(filtered, ord)
				}
			}
			h.state.Snapshot.ServiceOrders = filtered
		}
	case "service_order_items":
		if action == "UPDATE" && matchVal != "" && payload != nil {
			for _, ord := range h.state.Snapshot.ServiceOrders {
				items, ok := ord["items"].([]any)
				if !ok {
					continue
				}
				for _, rawIt := range items {
					it, ok := rawIt.(map[string]any)
					if !ok {
						continue
					}
					if id, _ := it["id"].(string); id == matchVal {
						for k, v := range payload {
							it[k] = v
						}
						return
					}
				}
			}
		}
	case "customers":
		if action == "INSERT" && payload != nil {
			h.state.Snapshot.Customers = upsertByID(h.state.Snapshot.Customers, payload)
		} else if action == "UPDATE" && matchVal != "" && payload != nil {
			for i, c := range h.state.Snapshot.Customers {
				if id, _ := c["id"].(string); id == matchVal {
					for k, v := range payload {
						h.state.Snapshot.Customers[i][k] = v
					}
					break
				}
			}
		}
	case "payments":
		if action == "INSERT" && payload != nil {
			h.state.Snapshot.Payments = upsertByID(h.state.Snapshot.Payments, payload)
		}
	case "cash_registers":
		if action == "INSERT" && payload != nil {
			if _, ok := payload["movements"]; !ok {
				payload["movements"] = []any{}
			}
			h.state.Snapshot.CashRegisters = upsertByID(h.state.Snapshot.CashRegisters, payload)
		} else if action == "UPDATE" && matchVal != "" && payload != nil {
			for i, r := range h.state.Snapshot.CashRegisters {
				if id, _ := r["id"].(string); id == matchVal {
					for k, v := range payload {
						h.state.Snapshot.CashRegisters[i][k] = v
					}
					break
				}
			}
		}
	case "cash_register_movements":
		if action == "INSERT" && payload != nil {
			regID, _ := payload["register_id"].(string)
			for i, r := range h.state.Snapshot.CashRegisters {
				if id, _ := r["id"].(string); id == regID {
					movs, _ := r["movements"].([]any)
					h.state.Snapshot.CashRegisters[i]["movements"] = append(movs, payload)
					break
				}
			}
		}
	}
}

func (h *HubServer) broadcastEvent(eventName string, payload any) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return
	}
	msg := fmt.Sprintf("event: %s\ndata: %s\n\n", eventName, string(raw))

	h.clientsMu.RLock()
	defer h.clientsMu.RUnlock()
	for _, c := range h.clients {
		select {
		case c.ch <- msg:
		default:
		}
	}
}

func (h *HubServer) listConnectedClients() []map[string]string {
	h.clientsMu.RLock()
	defer h.clientsMu.RUnlock()
	out := make([]map[string]string, 0, len(h.clients))
	for _, c := range h.clients {
		out = append(out, map[string]string{
			"terminalId":    c.terminalID,
			"terminalLabel": c.terminalLabel,
			"connectedAt":   c.connectedAt,
		})
	}
	return out
}

func (h *HubServer) checkAuthorized(r *http.Request) (bool, string) {
	h.mu.RLock()
	expected := strings.TrimSpace(h.config.Token)
	h.mu.RUnlock()

	if expected == "" {
		return false, "Hub Local ainda nao foi pareado. Abra Empresa > Sincronizacao no navegador deste PC e clique em Parear Hub Local."
	}
	if extractToken(r) != expected {
		return false, "Token invalido ou ausente."
	}
	return true, ""
}

func readJSONBody(r *http.Request, limit int64) (map[string]any, error) {
	defer r.Body.Close()
	body, err := io.ReadAll(io.LimitReader(r.Body, limit))
	if err != nil {
		return nil, err
	}
	if len(strings.TrimSpace(string(body))) == 0 {
		return map[string]any{}, nil
	}
	var parsed map[string]any
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, err
	}
	return parsed, nil
}

func (h *HubServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		setCORSHeaders(w, r)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	switch {
	case r.Method == http.MethodGet && r.URL.Path == "/":
		h.handleStatusPage(w, r)
	case r.Method == http.MethodGet && r.URL.Path == "/api/health":
		h.handleHealth(w, r)
	case r.Method == http.MethodPost && r.URL.Path == "/api/pair":
		h.handlePair(w, r)
	case r.Method == http.MethodGet && r.URL.Path == "/api/sync/state":
		h.handleGetState(w, r)
	case r.Method == http.MethodPost && r.URL.Path == "/api/sync/snapshot":
		h.handlePostSnapshot(w, r)
	case r.Method == http.MethodPost && r.URL.Path == "/api/sync/reserve-order-number":
		h.handleReserveOrderNumber(w, r)
	case r.Method == http.MethodPost && r.URL.Path == "/api/sync/mutate":
		h.handleMutate(w, r)
	case r.Method == http.MethodGet && r.URL.Path == "/api/sync/stream":
		h.handleStream(w, r)
	default:
		sendJSON(w, r, http.StatusNotFound, map[string]any{"ok": false, "error": "Endpoint nao encontrado"})
	}
}

func (h *HubServer) handleStatusPage(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	cfg := h.config
	st := h.state
	httpsReady := h.httpsReady
	h.mu.RUnlock()

	ips := getLanIPv4Addresses()
	clients := h.listConnectedClients()
	paired := strings.TrimSpace(cfg.Token) != "" && strings.TrimSpace(cfg.TenantID) != ""

	var ipHtml strings.Builder
	ipHtml.WriteString(fmt.Sprintf("<li>Este computador (HTTP): <code>http://localhost:%d</code></li>", cfg.Port))
	for _, ip := range ips {
		if httpsReady {
			ipHtml.WriteString(fmt.Sprintf("<li>Outros PCs na rede (HTTPS): <code>https://%s:%d</code></li>", html.EscapeString(ip), cfg.HTTPSPort))
		} else {
			ipHtml.WriteString(fmt.Sprintf("<li>Outros PCs na rede (HTTP): <code>http://%s:%d</code></li>", html.EscapeString(ip), cfg.Port))
		}
	}

	var clientsHtml strings.Builder
	if len(clients) == 0 {
		clientsHtml.WriteString("<li>Nenhum navegador conectado ao stream SSE no momento.</li>")
	} else {
		for _, c := range clients {
			clientsHtml.WriteString(fmt.Sprintf("<li><strong>%s</strong> (%s)</li>", html.EscapeString(c["terminalLabel"]), html.EscapeString(c["terminalId"])))
		}
	}

	statusBadge := `<span style="background:#f59e0b;color:#0b0f19;padding:3px 10px;border-radius:999px;font-weight:700;font-size:12px;">AGUARDANDO PAREAMENTO</span>`
	if paired {
		statusBadge = `<span style="background:#10b981;color:#052e16;padding:3px 10px;border-radius:999px;font-weight:700;font-size:12px;">PAREADO & ATIVO</span>`
	}

	setCORSHeaders(w, r)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = fmt.Fprintf(w, `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agil OS - Hub Local LAN</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;background:#0b0f19;color:#e2e8f0;padding:32px;max-width:740px;margin:auto;line-height:1.5}
.card{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:24px;margin-bottom:16px}
code{background:#1e293b;padding:3px 8px;border-radius:6px;color:#34d399;font-size:13px}
h1{color:#34d399;margin:0 0 8px 0;font-size:22px}
ul{margin:8px 0 0 18px;padding:0}
</style></head>
<body>
<div class="card">
  <h1>Agil OS — Hub Local LAN (Nativo)</h1>
  <div style="margin-bottom:12px;">%s</div>
  <p>Empresa: <strong>%s</strong></p>
  <p>Revisão atual: <code>#%d</code> • Última OS sequencial: <code>%d-%06d</code></p>
  <p><strong>Endereços de acesso:</strong></p>
  <ul>%s</ul>
</div>
<div class="card">
  <h3 style="margin-top:0;">Terminais Conectados (%d)</h3>
  <ul>%s</ul>
</div>
<div class="card" style="font-size:13px;color:#94a3b8;">
  Se ainda não pareou: abra <strong>https://agilos.supremeapps.com.br/empresa?tab=sincronizacao</strong> neste computador e clique em <strong>Parear Hub Local (1 Clique)</strong>.
</div>
</body></html>`,
		statusBadge,
		html.EscapeString(cfg.CompanyName),
		st.Revision,
		st.LastOrderYear,
		st.LastOrderSequence,
		ipHtml.String(),
		len(clients),
		clientsHtml.String(),
	)
}

func (h *HubServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	cfg := h.config
	st := h.state
	httpsReady := h.httpsReady
	h.mu.RUnlock()

	paired := strings.TrimSpace(cfg.Token) != "" && strings.TrimSpace(cfg.TenantID) != ""
	tokenProvided := extractToken(r)
	tokenValid := paired && tokenProvided == cfg.Token

	sendJSON(w, r, http.StatusOK, map[string]any{
		"ok":                true,
		"app":               "Agil OS LAN Hub",
		"version":           appVersion,
		"engine":            "go-native",
		"paired":            paired,
		"tenantId":          cfg.TenantID,
		"companyName":       cfg.CompanyName,
		"port":              cfg.Port,
		"httpsPort":         cfg.HTTPSPort,
		"httpsEnabled":      httpsReady,
		"lanIps":            getLanIPv4Addresses(),
		"connectedClients":  h.listConnectedClients(),
		"revision":          st.Revision,
		"mutationsCount":    len(st.RecentMutations),
		"lastOrderSequence": st.LastOrderSequence,
		"tokenValid":        tokenValid,
		"uptimeSeconds":     int(time.Since(h.startedAt).Seconds()),
	})
}

func (h *HubServer) handlePair(w http.ResponseWriter, r *http.Request) {
	if !isLoopbackRemote(r.RemoteAddr) {
		sendJSON(w, r, http.StatusForbidden, map[string]any{
			"ok":    false,
			"error": "Pareamento permitido apenas a partir do proprio computador servidor (localhost).",
		})
		return
	}

	body, err := readJSONBody(r, 1<<20)
	if err != nil {
		sendJSON(w, r, http.StatusBadRequest, map[string]any{"ok": false, "error": "JSON invalido"})
		return
	}

	tenantID, _ := body["tenantId"].(string)
	companyName, _ := body["companyName"].(string)
	token, _ := body["token"].(string)
	force, _ := body["force"].(bool)

	tenantID = strings.TrimSpace(tenantID)
	companyName = strings.TrimSpace(companyName)
	token = strings.TrimSpace(token)

	if tenantID == "" || token == "" {
		sendJSON(w, r, http.StatusBadRequest, map[string]any{
			"ok":    false,
			"error": "tenantId e token sao obrigatorios para parear o Hub Local.",
		})
		return
	}
	if companyName == "" {
		companyName = "Agil OS"
	}

	h.mu.Lock()
	tenantChanged := h.config.TenantID != "" && h.config.TenantID != tenantID
	if tenantChanged && !force {
		prevName := h.config.CompanyName
		h.mu.Unlock()
		sendJSON(w, r, http.StatusConflict, map[string]any{
			"ok":    false,
			"error": fmt.Sprintf("Este Hub ja esta pareado com '%s'. Confirme para trocar de empresa.", prevName),
		})
		return
	}

	h.config.TenantID = tenantID
	h.config.CompanyName = companyName
	h.config.Token = token
	h.config.PairedAt = time.Now().UTC().Format(time.RFC3339)

	if tenantChanged {
		h.state = HubState{
			TenantID:      tenantID,
			CompanyName:   companyName,
			LastOrderYear: time.Now().Year(),
			Snapshot:      defaultSnapshot(),
		}
		h.seenSet = make(map[string]struct{})
	} else {
		h.state.TenantID = tenantID
		h.state.CompanyName = companyName
	}

	if err := h.saveConfigLocked(); err != nil {
		h.mu.Unlock()
		sendJSON(w, r, http.StatusInternalServerError, map[string]any{"ok": false, "error": err.Error()})
		return
	}
	_ = h.saveStateLocked()
	cfg := h.config
	httpsReady := h.httpsReady
	h.mu.Unlock()

	ips := getLanIPv4Addresses()
	recommended := fmt.Sprintf("http://localhost:%d", cfg.Port)
	if len(ips) > 0 {
		if httpsReady {
			recommended = fmt.Sprintf("https://%s:%d", ips[0], cfg.HTTPSPort)
		} else {
			recommended = fmt.Sprintf("http://%s:%d", ips[0], cfg.Port)
		}
	}

	sendJSON(w, r, http.StatusOK, map[string]any{
		"ok":                true,
		"paired":            true,
		"tenantId":          cfg.TenantID,
		"companyName":       cfg.CompanyName,
		"port":              cfg.Port,
		"httpsPort":         cfg.HTTPSPort,
		"httpsEnabled":      httpsReady,
		"lanIps":            ips,
		"recommendedLanUrl": recommended,
	})
}

func (h *HubServer) handleGetState(w http.ResponseWriter, r *http.Request) {
	if ok, msg := h.checkAuthorized(r); !ok {
		sendJSON(w, r, http.StatusUnauthorized, map[string]any{"ok": false, "error": msg})
		return
	}

	h.mu.RLock()
	resp := map[string]any{
		"ok":                true,
		"revision":          h.state.Revision,
		"lastOrderYear":     h.state.LastOrderYear,
		"lastOrderSequence": h.state.LastOrderSequence,
		"snapshot":          h.state.Snapshot,
		"recentMutations":   h.state.RecentMutations,
	}
	h.mu.RUnlock()
	sendJSON(w, r, http.StatusOK, resp)
}

func (h *HubServer) handlePostSnapshot(w http.ResponseWriter, r *http.Request) {
	if ok, msg := h.checkAuthorized(r); !ok {
		sendJSON(w, r, http.StatusUnauthorized, map[string]any{"ok": false, "error": msg})
		return
	}

	body, err := readJSONBody(r, 15<<20)
	if err != nil {
		sendJSON(w, r, http.StatusBadRequest, map[string]any{"ok": false, "error": "Payload JSON invalido"})
		return
	}

	snapMap := body
	if nested, ok := body["snapshot"].(map[string]any); ok {
		snapMap = nested
	}

	h.mu.Lock()
	if rawOrders, ok := snapMap["serviceOrders"].([]any); ok {
		orders := make([]map[string]any, 0, len(rawOrders))
		yr := time.Now().Year()
		maxSeq := 0
		for _, item := range rawOrders {
			if m, ok := item.(map[string]any); ok {
				orders = append(orders, m)
				if toInt(m["order_year"]) == yr {
					if seq := toInt(m["order_sequence"]); seq > maxSeq {
						maxSeq = seq
					}
				}
			}
		}
		h.state.Snapshot.ServiceOrders = orders
		if yr > h.state.LastOrderYear || maxSeq > h.state.LastOrderSequence {
			h.state.LastOrderYear = yr
			if maxSeq > h.state.LastOrderSequence {
				h.state.LastOrderSequence = maxSeq
			}
		}
	}
	if rawCust, ok := snapMap["customers"].([]any); ok {
		list := make([]map[string]any, 0, len(rawCust))
		for _, item := range rawCust {
			if m, ok := item.(map[string]any); ok {
				list = append(list, m)
			}
		}
		h.state.Snapshot.Customers = list
	}
	if rawPay, ok := snapMap["payments"].([]any); ok {
		list := make([]map[string]any, 0, len(rawPay))
		for _, item := range rawPay {
			if m, ok := item.(map[string]any); ok {
				list = append(list, m)
			}
		}
		h.state.Snapshot.Payments = list
	}
	if rawRegs, ok := snapMap["cashRegisters"].([]any); ok {
		list := make([]map[string]any, 0, len(rawRegs))
		for _, item := range rawRegs {
			if m, ok := item.(map[string]any); ok {
				list = append(list, m)
			}
		}
		h.state.Snapshot.CashRegisters = list
	}

	h.state.Revision++
	_ = h.saveStateLocked()
	rev := h.state.Revision
	lastSeq := h.state.LastOrderSequence
	updatedAt := h.state.UpdatedAt
	h.mu.Unlock()

	h.broadcastEvent("snapshot", map[string]any{
		"revision":  rev,
		"updatedAt": updatedAt,
	})
	sendJSON(w, r, http.StatusOK, map[string]any{
		"ok":                true,
		"revision":          rev,
		"lastOrderSequence": lastSeq,
	})
}

func (h *HubServer) handleReserveOrderNumber(w http.ResponseWriter, r *http.Request) {
	if ok, msg := h.checkAuthorized(r); !ok {
		sendJSON(w, r, http.StatusUnauthorized, map[string]any{"ok": false, "error": msg})
		return
	}

	body, err := readJSONBody(r, 1<<20)
	if err != nil {
		sendJSON(w, r, http.StatusBadRequest, map[string]any{"ok": false, "error": "JSON invalido"})
		return
	}

	yr := toInt(body["year"])
	if yr == 0 {
		yr = time.Now().Year()
	}
	minSeq := toInt(body["minSequence"])

	h.mu.Lock()
	if yr > h.state.LastOrderYear {
		h.state.LastOrderYear = yr
		h.state.LastOrderSequence = minSeq
	}
	maxFromSnap := 0
	for _, ord := range h.state.Snapshot.ServiceOrders {
		if toInt(ord["order_year"]) == yr {
			if seq := toInt(ord["order_sequence"]); seq > maxFromSnap {
				maxFromSnap = seq
			}
		}
	}
	base := h.state.LastOrderSequence
	if maxFromSnap > base {
		base = maxFromSnap
	}
	if minSeq > base {
		base = minSeq
	}
	nextSeq := base + 1
	h.state.LastOrderSequence = nextSeq
	h.state.LastOrderYear = yr
	_ = h.saveStateLocked()
	h.mu.Unlock()

	orderNumber := fmt.Sprintf("%d-%06d", yr, nextSeq)
	sendJSON(w, r, http.StatusOK, map[string]any{
		"ok":            true,
		"orderNumber":   orderNumber,
		"orderSequence": nextSeq,
		"orderYear":     yr,
	})
}

func (h *HubServer) handleMutate(w http.ResponseWriter, r *http.Request) {
	if ok, msg := h.checkAuthorized(r); !ok {
		sendJSON(w, r, http.StatusUnauthorized, map[string]any{"ok": false, "error": msg})
		return
	}

	body, err := readJSONBody(r, 15<<20)
	if err != nil {
		sendJSON(w, r, http.StatusBadRequest, map[string]any{"ok": false, "error": "JSON invalido"})
		return
	}

	mutation, _ := body["mutation"].(map[string]any)
	mutID, _ := mutation["id"].(string)
	if mutation == nil || mutID == "" {
		sendJSON(w, r, http.StatusBadRequest, map[string]any{"ok": false, "error": "Mutation invalida (id obrigatorio)"})
		return
	}

	entitySnap, _ := body["entitySnapshot"].(map[string]any)
	terminalID, _ := body["terminalId"].(string)
	if terminalID == "" {
		terminalID = "unknown"
	}
	terminalLabel, _ := body["terminalLabel"].(string)
	if terminalLabel == "" {
		terminalLabel = "Terminal LAN"
	}

	h.mu.Lock()
	if _, exists := h.seenSet[mutID]; exists {
		rev := h.state.Revision
		h.mu.Unlock()
		sendJSON(w, r, http.StatusOK, map[string]any{
			"ok":           true,
			"deduplicated": true,
			"revision":     rev,
		})
		return
	}

	h.seenSet[mutID] = struct{}{}
	h.applyMutationLocked(mutation, entitySnap)
	h.state.Revision++

	ev := MutationEvent{
		Revision:       h.state.Revision,
		Mutation:       mutation,
		EntitySnapshot: entitySnap,
		TerminalID:     terminalID,
		TerminalLabel:  terminalLabel,
		ReceivedAt:     time.Now().UTC().Format(time.RFC3339),
	}
	h.state.RecentMutations = append(h.state.RecentMutations, ev)
	if len(h.state.RecentMutations) > 250 {
		h.state.RecentMutations = h.state.RecentMutations[len(h.state.RecentMutations)-250:]
	}
	_ = h.saveStateLocked()
	rev := h.state.Revision
	h.mu.Unlock()

	h.appendMutationLog(ev)
	h.broadcastEvent("mutation", ev)

	sendJSON(w, r, http.StatusOK, map[string]any{
		"ok":           true,
		"deduplicated": false,
		"revision":     rev,
	})
}

func (h *HubServer) handleStream(w http.ResponseWriter, r *http.Request) {
	if ok, msg := h.checkAuthorized(r); !ok {
		sendJSON(w, r, http.StatusUnauthorized, map[string]any{"ok": false, "error": msg})
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		sendJSON(w, r, http.StatusInternalServerError, map[string]any{"ok": false, "error": "Streaming SSE nao suportado"})
		return
	}

	setCORSHeaders(w, r)
	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache, no-transform")
	w.Header().Set("Connection", "keep-alive")

	clientID := fmt.Sprintf("cli_%d", time.Now().UnixNano())
	terminalID := strings.TrimSpace(r.URL.Query().Get("terminalId"))
	if terminalID == "" {
		terminalID = clientID
	}
	terminalLabel := strings.TrimSpace(r.URL.Query().Get("terminalLabel"))
	if terminalLabel == "" {
		terminalLabel = "Terminal"
	}

	client := &sseClient{
		id:            clientID,
		terminalID:    terminalID,
		terminalLabel: terminalLabel,
		connectedAt:   time.Now().UTC().Format(time.RFC3339),
		ch:            make(chan string, 32),
	}

	h.clientsMu.Lock()
	h.clients[clientID] = client
	count := len(h.clients)
	h.clientsMu.Unlock()

	h.mu.RLock()
	rev := h.state.Revision
	h.mu.RUnlock()

	initPayload, _ := json.Marshal(map[string]any{
		"ok":               true,
		"clientId":         clientID,
		"revision":         rev,
		"connectedClients": count,
	})
	_, _ = fmt.Fprintf(w, "event: connected\ndata: %s\n\n", string(initPayload))
	flusher.Flush()

	defer func() {
		h.clientsMu.Lock()
		delete(h.clients, clientID)
		h.clientsMu.Unlock()
	}()

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-client.ch:
			_, _ = io.WriteString(w, msg)
			flusher.Flush()
		case <-ticker.C:
			_, _ = io.WriteString(w, ": keepalive\n\n")
			flusher.Flush()
		}
	}
}

func setupFileLogger(dataDir string) {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return
	}
	logPath := filepath.Join(dataDir, "hub.log")
	f, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return
	}
	log.SetOutput(io.MultiWriter(os.Stderr, f))
}

func main() {
	dataDir := defaultDataDir()
	setupFileLogger(dataDir)

	hub, err := newHubServer(dataDir)
	if err != nil {
		log.Fatalf("[Hub LAN] Falha ao iniciar diretorio de dados %s: %v", dataDir, err)
	}

	httpAddr := fmt.Sprintf("0.0.0.0:%d", hub.config.Port)
	httpSrv := &http.Server{
		Addr:    httpAddr,
		Handler: hub,
	}

	var httpsSrv *http.Server
	if strings.TrimSpace(os.Getenv("AGILOS_DISABLE_HTTPS")) != "1" {
		cert, errCert := ensureSelfSignedCert(dataDir)
		if errCert != nil {
			log.Printf("[Hub LAN] Aviso ao gerar certificado HTTPS: %v", errCert)
		} else {
			httpsAddr := fmt.Sprintf("0.0.0.0:%d", hub.config.HTTPSPort)
			httpsSrv = &http.Server{
				Addr:    httpsAddr,
				Handler: hub,
				TLSConfig: &tls.Config{
					Certificates: []tls.Certificate{cert},
					MinVersion:   tls.VersionTLS12,
				},
			}
			lnTLS, errListen := net.Listen("tcp", httpsAddr)
			if errListen != nil {
				log.Printf("[Hub LAN] Nao foi possivel abrir HTTPS em %s: %v", httpsAddr, errListen)
			} else {
				hub.mu.Lock()
				hub.httpsReady = true
				hub.mu.Unlock()
				go func() {
					log.Printf("[Hub LAN] HTTPS ativo em https://0.0.0.0:%d", hub.config.HTTPSPort)
					if errServe := httpsSrv.ServeTLS(lnTLS, "", ""); errServe != nil && !errors.Is(errServe, http.ErrServerClosed) {
						log.Printf("[Hub LAN] Erro no servidor HTTPS: %v", errServe)
					}
				}()
			}
		}
	}

	go func() {
		log.Printf("[Hub LAN] HTTP ativo em http://localhost:%d (Dados: %s)", hub.config.Port, dataDir)
		if errServe := httpSrv.ListenAndServe(); errServe != nil && !errors.Is(errServe, http.ErrServerClosed) {
			log.Fatalf("[Hub LAN] Erro no servidor HTTP (%s): %v", httpAddr, errServe)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	<-sigCh

	hub.mu.Lock()
	_ = hub.saveStateLocked()
	hub.mu.Unlock()
	_ = httpSrv.Close()
	if httpsSrv != nil {
		_ = httpsSrv.Close()
	}
}
