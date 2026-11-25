import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { AppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  generateLanHubScript,
  generateLanHubToken,
  generateUnixHubInstaller,
  generateWindowsHubInstaller
} from '@/lib/lan-hub-generator';

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
    srv.on('error', reject);
  });
}

async function waitForHttpReady(url: string, timeoutMs = 5000): Promise<Response> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: any;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw lastErr || new Error(`Timeout aguardando ${url}`);
}

describe('Nível 1 & Nível 2: Resiliência Offline, Resolução de Colisões & Hub Local LAN', () => {
  const memStorage = new Map<string, string>();
  const origWindow = (globalThis as any).window;
  const origLocalStorage = (globalThis as any).localStorage;

  beforeEach(() => {
    memStorage.clear();
    const fakeStorage = {
      getItem: (k: string) => memStorage.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memStorage.set(k, String(v));
      },
      removeItem: (k: string) => {
        memStorage.delete(k);
      },
      clear: () => memStorage.clear()
    };
    const fakeWindow: any = {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      location: { protocol: 'https:', hostname: 'agilos.supremeapps.com.br', origin: 'https://agilos.supremeapps.com.br' }
    };
    (globalThis as any).window = fakeWindow;
    (globalThis as any).localStorage = fakeStorage;
    if (typeof (globalThis as any).CustomEvent === 'undefined') {
      (globalThis as any).CustomEvent = class CustomEvent {
        type: string;
        detail: any;
        constructor(type: string, init?: any) {
          this.type = type;
          this.detail = init?.detail;
        }
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).window = origWindow;
    (globalThis as any).localStorage = origLocalStorage;
  });

  it('persiste e audita configurações de Nível 1 e Nível 2 (sync_operation_mode, lan_hub_url, lan_hub_token)', () => {
    const tenantId = 'b2000000-0000-0000-0000-000000000001';
    vi.spyOn(AppStore, 'enqueueOrExecuteMutation').mockResolvedValue(undefined as any);

    const token = generateLanHubToken();
    expect(token).toMatch(/^agilos_hub_[a-f0-9]{32}$/);

    const updated = AppStore.updateSettings(
      tenantId,
      {
        sync_operation_mode: 'HYBRID_LAN_HUB',
        lan_hub_url: 'https://192.168.0.50:4322',
        lan_hub_token: token,
        lan_hub_port: 4321,
        lan_hub_auto_fallback: true
      },
      'Admin Teste'
    );

    expect(updated.sync_operation_mode).toBe('HYBRID_LAN_HUB');
    expect(updated.lan_hub_url).toBe('https://192.168.0.50:4322');
    expect(updated.lan_hub_token).toBe(token);

    const loaded = AppStore.getSettings(tenantId);
    expect(loaded.sync_operation_mode).toBe('HYBRID_LAN_HUB');
    expect(loaded.lan_hub_token).toBe(token);

    AppStore.updateSettings(tenantId, { sync_operation_mode: 'CLOUD_ONLY' }, 'Admin Teste');
  });

  it('resolve automaticamente colisão 23505 de número de OS offline renumerando sem perder a ordem nem movimentações', async () => {
    const tenantId = 'b2000000-0000-0000-0000-000000000001';
    const orderId = 'os-colisao-001';
    const year = new Date().getFullYear();

    // Injeta OS local que colidiu com outro balcão offline no número YYYY-000005
    const storeData = (AppStore as any).getStoreData();
    storeData.serviceOrders = [
      {
        id: orderId,
        tenant_id: tenantId,
        order_number: `${year}-000005`,
        order_sequence: 5,
        order_year: year,
        customer_id: 'cust-1',
        opened_by: 'user-1',
        status: 'ABERTA',
        financial_status: 'PENDENTE',
        subtotal_amount: 100,
        discount_amount: 0,
        surcharge_amount: 0,
        total_amount: 100,
        paid_amount: 0,
        remaining_amount: 100,
        tracking_token: 'TOKCOL1',
        items: [{ id: 'item-1', order_number: `${year}-000005` }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    (AppStore as any).saveStoreData(storeData, false);

    // Enfileira INSERT de service_orders (que vai falhar 23505 na 1a tentativa) + movimento de caixa filho
    AppStore.saveOfflineQueue([
      {
        id: 'mut-os-insert',
        table: 'service_orders',
        action: 'INSERT',
        tenant_id: tenantId,
        payload: {
          id: orderId,
          tenant_id: tenantId,
          order_number: `${year}-000005`,
          order_sequence: 5,
          order_year: year
        },
        created_at: new Date().toISOString(),
        retry_count: 0,
        status: 'PENDING'
      },
      {
        id: 'mut-mov-insert',
        table: 'cash_register_movements',
        action: 'INSERT',
        tenant_id: tenantId,
        payload: {
          id: 'mov-1',
          order_id: orderId,
          order_number: `${year}-000005`,
          description: `Recebimento da OS #${year}-000005 (PIX)`
        },
        created_at: new Date().toISOString(),
        retry_count: 0,
        status: 'PENDING'
      }
    ]);

    let serviceOrderInsertAttempts = 0;
    const insertedPayloads: any[] = [];

    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: [{ out_order_number: `${year}-000006`, out_sequence: 6, out_year: year }],
      error: null
    } as any);

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null })
          })
        }),
        insert: async (payload: any) => {
          insertedPayloads.push({ table, payload: { ...payload } });
          if (table === 'service_orders') {
            serviceOrderInsertAttempts += 1;
            if (serviceOrderInsertAttempts === 1) {
              return { error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
            }
          }
          return { error: null };
        }
      } as any;
    });

    const res = await AppStore.flushOfflineQueue();
    expect(res.processed).toBe(2);
    expect(res.failed).toBe(0);
    expect(AppStore.getOfflineQueue().length).toBe(0);

    // Verifica renumeração automática no banco e no store local
    const secondOsAttempt = insertedPayloads.filter(p => p.table === 'service_orders')[1];
    expect(secondOsAttempt.payload.order_number).toBe(`${year}-000006`);
    expect(secondOsAttempt.payload.order_sequence).toBe(6);

    const movAttempt = insertedPayloads.find(p => p.table === 'cash_register_movements');
    expect(movAttempt.payload.order_number).toBe(`${year}-000006`);
    expect(movAttempt.payload.description).toContain(`${year}-000006`);

    const updatedOrder = AppStore.getServiceOrderById(orderId);
    expect(updatedOrder?.order_number).toBe(`${year}-000006`);
    expect(updatedOrder?.internal_notes).toContain('Renumeração automática pós-offline');
  });

  it('nunca descarta mutações após 10 falhas: move para CONFLICT e permite reenvio ou descarte manual', async () => {
    AppStore.saveOfflineQueue([
      {
        id: 'mut-persistente',
        table: 'customers',
        action: 'INSERT',
        payload: { id: 'cust-err', name: 'Cliente Falha' },
        created_at: new Date().toISOString(),
        retry_count: 9,
        status: 'PENDING'
      }
    ]);

    vi.spyOn(supabase, 'from').mockImplementation(() => ({
      insert: async () => ({ error: { code: '42501', message: 'RLS policy rejected row' } })
    }) as any);

    await AppStore.flushOfflineQueue();

    const conflicts = AppStore.getOfflineConflicts();
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].id).toBe('mut-persistente');
    expect(conflicts[0].status).toBe('CONFLICT');
    expect(conflicts[0].last_error).toContain('RLS policy rejected row');

    // Consertando o retorno e reenviando manualmente
    vi.restoreAllMocks();
    vi.spyOn(supabase, 'from').mockImplementation(() => ({
      insert: async () => ({ error: null })
    }) as any);

    const retryRes = await AppStore.retryConflictMutation('mut-persistente');
    expect(retryRes.processed).toBe(1);
    expect(AppStore.getOfflineConflicts().length).toBe(0);
    expect(AppStore.getOfflineQueue().length).toBe(0);
  });

  it('sincroniza na ordem correta (flush antes de SELECT) e preserva pagamentos locais pendentes', async () => {
    const tenantId = 'b2000000-0000-0000-0000-000000000001';
    const callOrder: string[] = [];

    const storeData = (AppStore as any).getStoreData();
    storeData.payments = [
      { id: 'pay-local-offline', tenant_id: tenantId, amount: 90, payment_method: 'PIX', paid_at: new Date().toISOString(), created_at: new Date().toISOString() }
    ];
    (AppStore as any).saveStoreData(storeData, false);

    vi.spyOn(AppStore, 'flushOfflineQueue').mockImplementation(async () => {
      callOrder.push('FLUSH_FIRST');
      return { processed: 0, failed: 0 };
    });

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      callOrder.push(`SELECT_${table}`);
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        or: () => chain,
        is: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({ data: null, error: null }),
        then: (resolve: any) => resolve({
          data: table === 'payments'
            ? [{ id: 'pay-remote-1', tenant_id: tenantId, amount: 50, payment_method: 'DINHEIRO', paid_at: new Date().toISOString(), created_at: new Date().toISOString() }]
            : [],
          error: null
        })
      };
      return chain;
    });

    const synced = await AppStore.syncFromSupabase(tenantId);
    expect(callOrder[0]).toBe('FLUSH_FIRST');
    expect(callOrder.some(c => c.startsWith('SELECT_'))).toBe(true);
    expect(synced.payments.some((p: any) => p.id === 'pay-local-offline')).toBe(true);
    expect(synced.payments.some((p: any) => p.id === 'pay-remote-1')).toBe(true);
  });

  it('gera instaladores válidos e executa o Hub Local LAN real (health, auth 401, reserva atômica de OS e mutação SSE)', async () => {
    const cfg = {
      tenantId: 'b2000000-0000-0000-0000-000000000001',
      companyName: 'Supreme Assistência Teste',
      token: 'token_teste_lan_123',
      port: 4321,
      httpsPort: 4322
    };

    const winBat = generateWindowsHubInstaller(cfg);
    expect(winBat).toContain('Instalador Hub Local LAN');
    expect(winBat).toContain('agilos-lan-hub.mjs');

    const unixSh = generateUnixHubInstaller(cfg);
    expect(unixSh).toContain('#!/usr/bin/env bash');
    expect(unixSh).toContain('agilos-lan-hub.mjs');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agilos-hub-test-'));
    const hubScriptPath = path.join(tempDir, 'agilos-lan-hub.mjs');
    fs.writeFileSync(hubScriptPath, generateLanHubScript(cfg), 'utf8');

    const port = await getFreePort();
    let child: ChildProcess | null = null;

    try {
      child = spawn(process.execPath, [hubScriptPath], {
        env: {
          ...process.env,
          AGILOS_HUB_PORT: String(port),
          AGILOS_HUB_DATA_DIR: tempDir,
          AGILOS_DISABLE_HTTPS: '1'
        },
        stdio: 'ignore'
      });

      const baseUrl = `http://127.0.0.1:${port}`;
      const healthRes = await waitForHttpReady(`${baseUrl}/api/health`);
      const healthNoToken = await healthRes.json();
      expect(healthNoToken.ok).toBe(true);
      expect(healthNoToken.tokenValid).toBe(false);

      const unauthState = await fetch(`${baseUrl}/api/sync/state`);
      expect(unauthState.status).toBe(401);

      const res1 = await fetch(`${baseUrl}/api/sync/reserve-order-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-AgilOS-Token': cfg.token },
        body: JSON.stringify({ year: 2026 })
      });
      const seq1 = await res1.json();

      const res2 = await fetch(`${baseUrl}/api/sync/reserve-order-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-AgilOS-Token': cfg.token },
        body: JSON.stringify({ year: 2026 })
      });
      const seq2 = await res2.json();

      expect(seq1.orderNumber).toBe('2026-000001');
      expect(seq2.orderNumber).toBe('2026-000002');

      const mutRes = await fetch(`${baseUrl}/api/sync/mutate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-AgilOS-Token': cfg.token },
        body: JSON.stringify({
          terminalId: 'balcao-1',
          terminalLabel: 'Balcão 1',
          mutation: {
            id: 'mut-lan-1',
            table: 'service_orders',
            action: 'INSERT',
            payload: { id: 'os-lan-99', tenant_id: cfg.tenantId, order_number: '2026-000002' }
          },
          entitySnapshot: {
            serviceOrder: {
              id: 'os-lan-99',
              tenant_id: cfg.tenantId,
              order_number: '2026-000002',
              order_sequence: 2,
              order_year: 2026
            }
          }
        })
      });
      const mutBody = await mutRes.json();
      expect(mutBody.ok).toBe(true);
      expect(mutBody.deduplicated).toBe(false);

      // Envio duplicado da mesma mutação deve ser deduplicado
      const dupRes = await fetch(`${baseUrl}/api/sync/mutate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-AgilOS-Token': cfg.token },
        body: JSON.stringify({
          terminalId: 'balcao-1',
          mutation: { id: 'mut-lan-1', table: 'service_orders', action: 'INSERT', payload: {} }
        })
      });
      expect((await dupRes.json()).deduplicated).toBe(true);

      const stateRes = await fetch(`${baseUrl}/api/sync/state`, {
        headers: { 'X-AgilOS-Token': cfg.token }
      });
      const stateJson = await stateRes.json();
      expect(stateJson.ok).toBe(true);
      expect(stateJson.snapshot.serviceOrders.some((o: any) => o.id === 'os-lan-99')).toBe(true);
    } finally {
      if (child) {
        try {
          child.kill();
        } catch {}
      }
      await new Promise((r) => setTimeout(r, 150));
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
  }, 15000);
});
