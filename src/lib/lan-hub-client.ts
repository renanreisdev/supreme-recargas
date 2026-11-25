// ============================================================================
// AGIL OS - LEVEL 2 LAN HUB BROWSER CLIENT
// Gerencia conexão SSE, fallback automático, reserva de OS na rede local
// e transmissão em tempo real entre balcões e bancada técnica sem internet.
// ============================================================================

import { LanHubHealthStatus, TerminalSyncConfig } from '@/types';

const TERMINAL_CONFIG_KEY = 'agilos_terminal_sync_v1';

function randomShortId(): string {
  return 'term_' + Math.random().toString(36).slice(2, 10);
}

export function getTerminalSyncConfig(): TerminalSyncConfig {
  if (typeof window === 'undefined') {
    return { terminalId: 'server_ssr', terminalLabel: 'Servidor' };
  }
  try {
    const raw = localStorage.getItem(TERMINAL_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.terminalId) {
        return {
          terminalId: parsed.terminalId,
          terminalLabel: parsed.terminalLabel || 'Computador Local',
          localHubUrlOverride: parsed.localHubUrlOverride || ''
        };
      }
    }
  } catch {}

  const created: TerminalSyncConfig = {
    terminalId: randomShortId(),
    terminalLabel: 'Computador 01',
    localHubUrlOverride: ''
  };
  saveTerminalSyncConfig(created);
  return created;
}

export function saveTerminalSyncConfig(config: Partial<TerminalSyncConfig>): TerminalSyncConfig {
  const current = typeof window === 'undefined'
    ? { terminalId: 'server_ssr', terminalLabel: 'Servidor' }
    : (() => {
        try {
          const raw = localStorage.getItem(TERMINAL_CONFIG_KEY);
          return raw ? JSON.parse(raw) : { terminalId: randomShortId(), terminalLabel: 'Computador 01' };
        } catch {
          return { terminalId: randomShortId(), terminalLabel: 'Computador 01' };
        }
      })();

  const updated: TerminalSyncConfig = {
    terminalId: current.terminalId || randomShortId(),
    terminalLabel: config.terminalLabel !== undefined ? config.terminalLabel : (current.terminalLabel || 'Computador 01'),
    localHubUrlOverride: config.localHubUrlOverride !== undefined ? config.localHubUrlOverride : (current.localHubUrlOverride || '')
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TERMINAL_CONFIG_KEY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

export function normalizeHubUrl(url?: string): string {
  return (url || '').trim().replace(/\/+$/, '');
}

export function fixHttpsHttpPortMismatch(
  url: string,
  httpPort = 4321
): { url: string; corrected: boolean; expectedHttpsPort: number } {
  const clean = normalizeHubUrl(url);
  const expectedHttpsPort = httpPort + 1;
  if (!clean) {
    return { url: '', corrected: false, expectedHttpsPort };
  }
  try {
    const parsed = new URL(clean);
    if (parsed.protocol === 'https:' && Number(parsed.port) === httpPort) {
      parsed.port = String(expectedHttpsPort);
      return {
        url: normalizeHubUrl(parsed.toString()),
        corrected: true,
        expectedHttpsPort
      };
    }
  } catch {
    // URL malformada ou parcial: mantém string normalizada
  }
  return { url: clean, corrected: false, expectedHttpsPort };
}

export function resolveEffectiveHubUrl(companyDefaultUrl?: string): string {
  const terminal = getTerminalSyncConfig();
  return normalizeHubUrl(terminal.localHubUrlOverride || companyDefaultUrl);
}

export async function testLanHubConnection(hubUrl: string, token?: string, httpPort = 4321): Promise<LanHubHealthStatus> {
  const cleanUrl = normalizeHubUrl(hubUrl);
  if (!cleanUrl) {
    return { ok: false, error: 'Informe o endereço do Hub Local (ex.: http://localhost:4321 ou https://192.168.0.10:4322).' };
  }

  const portCheck = fixHttpsHttpPortMismatch(cleanUrl, httpPort);
  if (portCheck.corrected) {
    return {
      ok: false,
      error: `Você informou https:// na porta HTTP (${httpPort}). Para outros PCs via HTTPS, use a porta ${portCheck.expectedHttpsPort} (ex.: ${portCheck.url}).`
    };
  }

  const isMixedContent =
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    cleanUrl.startsWith('http://') &&
    !cleanUrl.includes('localhost') &&
    !cleanUrl.includes('127.0.0.1');

  if (isMixedContent) {
    return {
      ok: false,
      mixedContentBlocked: true,
      error: 'Navegadores HTTPS exigem https:// para IPs da rede local (use a porta HTTPS 4322 do Hub, ex.: https://192.168.0.10:4322, ou http://localhost:4321 neste mesmo PC).'
    };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(`${cleanUrl}/api/health`, {
      method: 'GET',
      headers: token ? { 'X-AgilOS-Token': token } : undefined,
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();
    return {
      ...data,
      ok: Boolean(data?.ok),
      latencyMs: Date.now() - started
    };
  } catch (err: any) {
    clearTimeout(timeout);
    const isHttps = cleanUrl.startsWith('https://');
    return {
      ok: false,
      needsCertTrust: isHttps,
      error: isHttps
        ? 'Não foi possível conectar via HTTPS. Se for a 1ª vez neste PC, abra o endereço do Hub no navegador e aceite o certificado local. Se a página nem abrir, verifique se o Firewall/Antivírus do PC servidor libera a porta HTTPS.'
        : (err?.name === 'AbortError' ? 'Tempo limite esgotado ao conectar no Hub Local.' : (err?.message || 'Hub Local inacessível.'))
    };
  }
}

export interface LanHubPairResponse {
  ok: boolean;
  paired?: boolean;
  tenantId?: string;
  companyName?: string;
  port?: number;
  httpsPort?: number;
  httpsEnabled?: boolean;
  lanIps?: string[];
  recommendedLanUrl?: string;
  error?: string;
}

export async function pairLocalLanHub(
  hubUrl: string,
  params: { tenantId: string; companyName: string; token: string; force?: boolean }
): Promise<LanHubPairResponse> {
  const cleanUrl = normalizeHubUrl(hubUrl);
  if (!cleanUrl) {
    return { ok: false, error: 'Informe o endereço local do Hub (ex.: http://localhost:4321).' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(`${cleanUrl}/api/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();
    return {
      ...data,
      ok: Boolean(res.ok && data?.ok)
    };
  } catch (err: any) {
    clearTimeout(timeout);
    return {
      ok: false,
      error:
        err?.name === 'AbortError'
          ? 'Tempo limite esgotado. Verifique se o AgilOS Hub já foi instalado e está em execução neste computador.'
          : (err?.message || 'Não foi possível alcançar o Hub Local em http://localhost:4321.')
    };
  }
}

export interface LanMutationEvent {
  revision: number;
  mutation: any;
  entitySnapshot?: any;
  terminalId: string;
  terminalLabel: string;
  receivedAt: string;
}

type StatusListener = (status: { connected: boolean; connectedClients: number; revision: number }) => void;

class LanHubClient {
  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelayMs = 3000;
  private connected = false;
  private connectedClients = 0;
  private revision = 0;
  private activeUrl = '';
  private activeToken = '';
  private activeTenantId = '';
  private onEventCb: ((ev: LanMutationEvent) => void) | null = null;
  private onSnapshotCb: ((statePayload: any) => void) | null = null;
  private onStatusCb: StatusListener | null = null;

  getStatus() {
    return {
      connected: this.connected,
      connectedClients: this.connectedClients,
      revision: this.revision,
      activeUrl: this.activeUrl
    };
  }

  private emitStatus() {
    if (this.onStatusCb) {
      this.onStatusCb({
        connected: this.connected,
        connectedClients: this.connectedClients,
        revision: this.revision
      });
    }
  }

  connect(
    hubUrl: string,
    token: string,
    tenantId: string,
    onEvent: (ev: LanMutationEvent) => void,
    onSnapshot: (statePayload: any) => void,
    onStatus?: StatusListener
  ) {
    if (typeof window === 'undefined') return;
    const cleanUrl = normalizeHubUrl(hubUrl);
    if (!cleanUrl) {
      this.disconnect();
      return;
    }

    if (
      this.eventSource &&
      this.activeUrl === cleanUrl &&
      this.activeToken === token &&
      this.activeTenantId === tenantId
    ) {
      return;
    }

    this.disconnect();
    this.activeUrl = cleanUrl;
    this.activeToken = token;
    this.activeTenantId = tenantId;
    this.onEventCb = onEvent;
    this.onSnapshotCb = onSnapshot;
    this.onStatusCb = onStatus || null;
    this.reconnectDelayMs = 3000;

    this.openStream();
  }

  private openStream() {
    if (!this.activeUrl || typeof EventSource === 'undefined') return;
    const term = getTerminalSyncConfig();
    const qs = new URLSearchParams({
      token: this.activeToken || '',
      terminalId: term.terminalId,
      terminalLabel: term.terminalLabel
    });

    try {
      const es = new EventSource(`${this.activeUrl}/api/sync/stream?${qs.toString()}`);
      this.eventSource = es;

      es.addEventListener('connected', (msg: any) => {
        try {
          const payload = JSON.parse(msg.data || '{}');
          this.connected = true;
          this.connectedClients = Number(payload.connectedClients || 1);
          this.revision = Number(payload.revision || 0);
          this.reconnectDelayMs = 3000;
          this.emitStatus();
          this.pullInitialState();
        } catch {}
      });

      es.addEventListener('mutation', (msg: any) => {
        try {
          const payload: LanMutationEvent = JSON.parse(msg.data || '{}');
          this.revision = Math.max(this.revision, Number(payload.revision || 0));
          if (payload.terminalId !== term.terminalId && this.onEventCb) {
            this.onEventCb(payload);
          }
          this.emitStatus();
        } catch {}
      });

      es.addEventListener('snapshot', () => {
        this.pullInitialState();
      });

      es.onerror = () => {
        this.connected = false;
        this.emitStatus();
        try {
          es.close();
        } catch {}
        this.eventSource = null;

        if (!this.reconnectTimer && this.activeUrl) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 1.5, 15000);
            this.openStream();
          }, this.reconnectDelayMs);
        }
      };
    } catch {
      this.connected = false;
      this.emitStatus();
    }
  }

  async pullInitialState() {
    if (!this.activeUrl) return;
    try {
      const res = await fetch(`${this.activeUrl}/api/sync/state`, {
        headers: this.activeToken ? { 'X-AgilOS-Token': this.activeToken } : undefined
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok && this.onSnapshotCb) {
        this.revision = Number(data.revision || 0);
        this.onSnapshotCb(data);
        this.emitStatus();
      }
    } catch {}
  }

  async pushMutation(mutation: any, entitySnapshot?: any): Promise<boolean> {
    if (!this.activeUrl) return false;
    const term = getTerminalSyncConfig();
    try {
      const res = await fetch(`${this.activeUrl}/api/sync/mutate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.activeToken ? { 'X-AgilOS-Token': this.activeToken } : {})
        },
        body: JSON.stringify({
          mutation,
          entitySnapshot,
          terminalId: term.terminalId,
          terminalLabel: term.terminalLabel
        })
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data?.revision) {
        this.revision = Math.max(this.revision, Number(data.revision));
      }
      return Boolean(data?.ok);
    } catch {
      return false;
    }
  }

  async pushSnapshot(snapshot: any): Promise<boolean> {
    if (!this.activeUrl || !this.connected) return false;
    try {
      const res = await fetch(`${this.activeUrl}/api/sync/snapshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.activeToken ? { 'X-AgilOS-Token': this.activeToken } : {})
        },
        body: JSON.stringify({ snapshot })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
    this.connected = false;
    this.connectedClients = 0;
    this.activeUrl = '';
    this.activeToken = '';
    this.activeTenantId = '';
    this.emitStatus();
  }
}

export const lanHubClient = new LanHubClient();
