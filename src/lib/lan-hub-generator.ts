// ============================================================================
// AGIL OS - LEVEL 2 LOCAL LAN HUB GENERATOR & 1-CLICK INSTALLERS
// Gera um micro-servidor Node.js 18+ sem dependências externas para operar em
// rede local (LAN) entre balcões e bancada técnica mesmo sem internet externa.
// ============================================================================

export interface LanHubGeneratorConfig {
  tenantId: string;
  companyName: string;
  token: string;
  port?: number;
  httpsPort?: number;
}

export function generateLanHubToken(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `agilos_hub_${hex}`;
}

function encodeUtf8ToBase64(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf8').toString('base64');
  }
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function generateLanHubScript(config: LanHubGeneratorConfig): string {
  const port = Number(config.port) || 4321;
  const httpsPort = Number(config.httpsPort) || port + 1;
  const tenantId = JSON.stringify(config.tenantId || '');
  const companyName = JSON.stringify(config.companyName || 'Agil OS');
  const token = JSON.stringify(config.token || '');

  return `#!/usr/bin/env node
// ============================================================================
// Agil OS - Hub Local LAN (Nivel 2 Hibrido)
// Servidor leve sem dependencias externas (Node.js 18+)
// ============================================================================

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  tenantId: ${tenantId},
  companyName: ${companyName},
  token: process.env.AGILOS_HUB_TOKEN || ${token},
  port: Number(process.env.AGILOS_HUB_PORT || ${port}),
  httpsPort: Number(process.env.AGILOS_HUB_HTTPS_PORT || ${httpsPort}),
  dataDir: process.env.AGILOS_HUB_DATA_DIR || __dirname,
  disableHttps: process.env.AGILOS_DISABLE_HTTPS === '1'
};

if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

const DATA_FILE = path.join(CONFIG.dataDir, 'hub-data.json');
const LOG_FILE = path.join(CONFIG.dataDir, 'hub-mutations.ndjson');
const KEY_FILE = path.join(CONFIG.dataDir, 'hub-key.pem');
const CERT_FILE = path.join(CONFIG.dataDir, 'hub-cert.pem');
const STARTED_AT = Date.now();

function getLanIpv4Addresses() {
  const ifaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(ifaces)) {
    for (const info of ifaces[name] || []) {
      if (info && info.family === 'IPv4' && !info.internal) {
        ips.push(info.address);
      }
    }
  }
  return Array.from(new Set(ips));
}

function createInitialState() {
  return {
    tenantId: CONFIG.tenantId,
    companyName: CONFIG.companyName,
    revision: 0,
    lastOrderYear: new Date().getFullYear(),
    lastOrderSequence: 0,
    updatedAt: new Date().toISOString(),
    seenMutationIds: [],
    recentMutations: [],
    snapshot: {
      serviceOrders: [],
      customers: [],
      payments: [],
      cashRegisters: []
    }
  };
}

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return {
        ...createInitialState(),
        ...parsed,
        snapshot: {
          ...createInitialState().snapshot,
          ...(parsed.snapshot || {})
        }
      };
    }
  } catch (err) {
    console.warn('[Hub] Falha ao ler hub-data.json, iniciando estado limpo:', err?.message);
  }
  return createInitialState();
}

let state = loadState();
const seenSet = new Set(Array.isArray(state.seenMutationIds) ? state.seenMutationIds : []);
const sseClients = new Map();

function saveStateAtomic() {
  state.updatedAt = new Date().toISOString();
  state.seenMutationIds = Array.from(seenSet).slice(-1000);
  const tmpFile = DATA_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}

function appendMutationLog(entry) {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\\n', 'utf8');
  } catch (err) {
    console.warn('[Hub] Nao foi possivel gravar hub-mutations.ndjson:', err?.message);
  }
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-AgilOS-Token, Authorization');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
}

function sendJson(req, res, statusCode, payload) {
  setCorsHeaders(req, res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function extractToken(req, urlObj) {
  const headerToken = req.headers['x-agilos-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) return headerToken.trim();
  const queryToken = urlObj.searchParams.get('token');
  if (queryToken && queryToken.trim()) return queryToken.trim();
  return '';
}

function isAuthorized(req, urlObj) {
  if (!CONFIG.token) return true;
  return extractToken(req, urlObj) === CONFIG.token;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 15 * 1024 * 1024) {
        reject(new Error('Payload excedeu limite de 15MB'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function broadcastEvent(eventName, payload, excludeClientId = null) {
  const serialized = \`event: \${eventName}\\ndata: \${JSON.stringify(payload)}\\n\\n\`;
  for (const [clientId, client] of sseClients.entries()) {
    if (excludeClientId && clientId === excludeClientId) continue;
    try {
      client.res.write(serialized);
    } catch {
      sseClients.delete(clientId);
    }
  }
}

function upsertById(list, item) {
  if (!item || !item.id) return list;
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [item, ...list];
  const next = list.slice();
  next[idx] = { ...next[idx], ...item };
  return next;
}

function applyMutationToSnapshot(mutation, entitySnapshot) {
  if (!mutation || !mutation.table) return;
  const snap = state.snapshot;
  if (entitySnapshot && entitySnapshot.serviceOrder) {
    snap.serviceOrders = upsertById(snap.serviceOrders || [], entitySnapshot.serviceOrder);
    if (entitySnapshot.serviceOrder.order_sequence) {
      const yr = Number(entitySnapshot.serviceOrder.order_year || new Date().getFullYear());
      const seq = Number(entitySnapshot.serviceOrder.order_sequence || 0);
      if (yr > state.lastOrderYear) {
        state.lastOrderYear = yr;
        state.lastOrderSequence = seq;
      } else if (yr === state.lastOrderYear && seq > state.lastOrderSequence) {
        state.lastOrderSequence = seq;
      }
    }
  }
  if (entitySnapshot && entitySnapshot.customer) {
    snap.customers = upsertById(snap.customers || [], entitySnapshot.customer);
  }
  if (entitySnapshot && entitySnapshot.payment) {
    snap.payments = upsertById(snap.payments || [], entitySnapshot.payment);
  }
  if (entitySnapshot && entitySnapshot.cashRegister) {
    snap.cashRegisters = upsertById(snap.cashRegisters || [], entitySnapshot.cashRegister);
  }

  const payload = mutation.payload || {};
  if (mutation.table === 'service_orders') {
    if (mutation.action === 'INSERT' && payload.id) {
      snap.serviceOrders = upsertById(snap.serviceOrders || [], payload);
    } else if (mutation.action === 'UPDATE' && mutation.matchValue) {
      const idx = (snap.serviceOrders || []).findIndex((o) => o.id === mutation.matchValue);
      if (idx !== -1) {
        snap.serviceOrders[idx] = { ...snap.serviceOrders[idx], ...payload };
      }
    } else if (mutation.action === 'DELETE' && mutation.matchValue) {
      snap.serviceOrders = (snap.serviceOrders || []).filter((o) => o.id !== mutation.matchValue);
    }
  } else if (mutation.table === 'service_order_items' && mutation.action === 'UPDATE' && mutation.matchValue) {
    for (const order of snap.serviceOrders || []) {
      if (!Array.isArray(order.items)) continue;
      const itemIdx = order.items.findIndex((it) => it.id === mutation.matchValue);
      if (itemIdx !== -1) {
        order.items[itemIdx] = { ...order.items[itemIdx], ...payload };
        break;
      }
    }
  } else if (mutation.table === 'customers') {
    if (mutation.action === 'INSERT' && payload.id) {
      snap.customers = upsertById(snap.customers || [], payload);
    } else if (mutation.action === 'UPDATE' && mutation.matchValue) {
      const idx = (snap.customers || []).findIndex((c) => c.id === mutation.matchValue);
      if (idx !== -1) snap.customers[idx] = { ...snap.customers[idx], ...payload };
    }
  } else if (mutation.table === 'payments' && mutation.action === 'INSERT' && payload.id) {
    snap.payments = upsertById(snap.payments || [], payload);
  } else if (mutation.table === 'cash_registers') {
    if (mutation.action === 'INSERT' && payload.id) {
      snap.cashRegisters = upsertById(snap.cashRegisters || [], { movements: [], ...payload });
    } else if (mutation.action === 'UPDATE' && mutation.matchValue) {
      const idx = (snap.cashRegisters || []).findIndex((r) => r.id === mutation.matchValue);
      if (idx !== -1) snap.cashRegisters[idx] = { ...snap.cashRegisters[idx], ...payload };
    }
  } else if (mutation.table === 'cash_register_movements' && mutation.action === 'INSERT' && payload.register_id) {
    const regIdx = (snap.cashRegisters || []).findIndex((r) => r.id === payload.register_id);
    if (regIdx !== -1) {
      const movs = Array.isArray(snap.cashRegisters[regIdx].movements) ? snap.cashRegisters[regIdx].movements : [];
      snap.cashRegisters[regIdx].movements = upsertById(movs, payload);
    }
  }
}

let httpsEnabled = false;

async function handleRequest(req, res) {
  const urlObj = new URL(req.url || '/', \`http://\${req.headers.host || 'localhost'}\`);
  const pathname = urlObj.pathname;

  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/') {
    const ips = getLanIpv4Addresses();
    const clientsHtml = Array.from(sseClients.values())
      .map((c) => \`<li><strong>\${c.terminalLabel}</strong> (\${c.terminalId})</li>\`)
      .join('') || '<li>Nenhum terminal conectado no momento</li>';
    setCorsHeaders(req, res);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(\`<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Agil OS LAN Hub</title>
<style>body{font-family:system-ui,sans-serif;background:#0b0f19;color:#e2e8f0;padding:32px;max-width:720px;margin:auto}
.card{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:24px;margin-bottom:16px}
code{background:#1e293b;padding:3px 8px;border-radius:6px;color:#34d399;font-size:13px}
h1{color:#34d399;margin-top:0}</style></head>
<body>
<div class="card">
<h1>Agil OS — Hub Local LAN Ativo</h1>
<p>Empresa: <strong>\${CONFIG.companyName}</strong></p>
<p>Revisao atual: <code>#\${state.revision}</code> | Ultima OS sequencial: <code>\${state.lastOrderYear}-\${String(state.lastOrderSequence).padStart(6, '0')}</code></p>
<p>Enderecos locais:<br>
• Este PC: <code>http://localhost:\${CONFIG.port}</code><br>
\${ips.map((ip) => \`• Rede LAN: <code>\${httpsEnabled ? 'https' : 'http'}://\${ip}:\${httpsEnabled ? CONFIG.httpsPort : CONFIG.port}</code>\`).join('<br>')}
</p>
</div>
<div class="card">
<h3>Terminais Conectados (\${sseClients.size})</h3>
<ul>\${clientsHtml}</ul>
</div>
</body></html>\`);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    const tokenProvided = extractToken(req, urlObj);
    return sendJson(req, res, 200, {
      ok: true,
      app: 'Agil OS LAN Hub',
      version: '1.0.0',
      tenantId: CONFIG.tenantId,
      companyName: CONFIG.companyName,
      port: CONFIG.port,
      httpsPort: CONFIG.httpsPort,
      httpsEnabled,
      lanIps: getLanIpv4Addresses(),
      connectedClients: Array.from(sseClients.values()).map((c) => ({
        terminalId: c.terminalId,
        terminalLabel: c.terminalLabel,
        connectedAt: c.connectedAt
      })),
      revision: state.revision,
      mutationsCount: state.recentMutations.length,
      lastOrderSequence: state.lastOrderSequence,
      tokenValid: !CONFIG.token || tokenProvided === CONFIG.token,
      uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000)
    });
  }

  if (!isAuthorized(req, urlObj)) {
    return sendJson(req, res, 401, { ok: false, error: 'Token invalido ou ausente.' });
  }

  if (req.method === 'GET' && pathname === '/api/sync/state') {
    return sendJson(req, res, 200, {
      ok: true,
      revision: state.revision,
      lastOrderYear: state.lastOrderYear,
      lastOrderSequence: state.lastOrderSequence,
      snapshot: state.snapshot,
      recentMutations: state.recentMutations
    });
  }

  if (req.method === 'POST' && pathname === '/api/sync/snapshot') {
    try {
      const body = await readJsonBody(req);
      const snap = body?.snapshot || body || {};
      if (Array.isArray(snap.serviceOrders)) {
        state.snapshot.serviceOrders = snap.serviceOrders;
        const yr = new Date().getFullYear();
        const maxSeq = snap.serviceOrders
          .filter((o) => Number(o.order_year) === yr)
          .reduce((m, o) => Math.max(m, Number(o.order_sequence || 0)), 0);
        if (maxSeq > state.lastOrderSequence || yr > state.lastOrderYear) {
          state.lastOrderYear = yr;
          state.lastOrderSequence = Math.max(state.lastOrderSequence, maxSeq);
        }
      }
      if (Array.isArray(snap.customers)) state.snapshot.customers = snap.customers;
      if (Array.isArray(snap.payments)) state.snapshot.payments = snap.payments;
      if (Array.isArray(snap.cashRegisters)) state.snapshot.cashRegisters = snap.cashRegisters;
      state.revision += 1;
      saveStateAtomic();
      broadcastEvent('snapshot', { revision: state.revision, updatedAt: state.updatedAt });
      return sendJson(req, res, 200, { ok: true, revision: state.revision, lastOrderSequence: state.lastOrderSequence });
    } catch (err) {
      return sendJson(req, res, 400, { ok: false, error: err?.message || 'Erro ao salvar snapshot' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/sync/reserve-order-number') {
    try {
      const body = await readJsonBody(req);
      const yr = Number(body?.year || new Date().getFullYear());
      const minSeq = Number(body?.minSequence || 0);
      if (yr > state.lastOrderYear) {
        state.lastOrderYear = yr;
        state.lastOrderSequence = minSeq;
      }
      const maxFromSnapshot = (state.snapshot.serviceOrders || [])
        .filter((o) => Number(o.order_year) === yr)
        .reduce((m, o) => Math.max(m, Number(o.order_sequence || 0)), 0);
      const base = Math.max(state.lastOrderSequence, maxFromSnapshot, minSeq);
      const nextSeq = base + 1;
      state.lastOrderSequence = nextSeq;
      state.lastOrderYear = yr;
      saveStateAtomic();
      const orderNumber = \`\${yr}-\${String(nextSeq).padStart(6, '0')}\`;
      return sendJson(req, res, 200, { ok: true, orderNumber, orderSequence: nextSeq, orderYear: yr });
    } catch (err) {
      return sendJson(req, res, 400, { ok: false, error: err?.message || 'Erro ao reservar numero de OS' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/sync/mutate') {
    try {
      const body = await readJsonBody(req);
      const mutation = body?.mutation;
      const entitySnapshot = body?.entitySnapshot || null;
      const terminalId = body?.terminalId || 'unknown';
      const terminalLabel = body?.terminalLabel || 'Terminal LAN';

      if (!mutation || !mutation.id) {
        return sendJson(req, res, 400, { ok: false, error: 'Mutation invalida (id obrigatorio)' });
      }

      if (seenSet.has(mutation.id)) {
        return sendJson(req, res, 200, { ok: true, deduplicated: true, revision: state.revision });
      }

      seenSet.add(mutation.id);
      applyMutationToSnapshot(mutation, entitySnapshot);
      state.revision += 1;

      const eventRecord = {
        revision: state.revision,
        mutation,
        entitySnapshot,
        terminalId,
        terminalLabel,
        receivedAt: new Date().toISOString()
      };
      state.recentMutations.push(eventRecord);
      if (state.recentMutations.length > 250) {
        state.recentMutations = state.recentMutations.slice(-250);
      }

      saveStateAtomic();
      appendMutationLog(eventRecord);
      broadcastEvent('mutation', eventRecord);

      return sendJson(req, res, 200, { ok: true, deduplicated: false, revision: state.revision });
    } catch (err) {
      return sendJson(req, res, 400, { ok: false, error: err?.message || 'Erro ao processar mutacao' });
    }
  }

  if (req.method === 'GET' && pathname === '/api/sync/stream') {
    const clientId = \`cli_\${Date.now()}_\${Math.random().toString(36).slice(2, 8)}\`;
    const terminalId = urlObj.searchParams.get('terminalId') || clientId;
    const terminalLabel = urlObj.searchParams.get('terminalLabel') || 'Terminal';

    setCorsHeaders(req, res);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    });

    const clientEntry = {
      res,
      terminalId,
      terminalLabel,
      connectedAt: new Date().toISOString()
    };
    sseClients.set(clientId, clientEntry);

    res.write(\`event: connected\\ndata: \${JSON.stringify({
      ok: true,
      clientId,
      revision: state.revision,
      connectedClients: sseClients.size
    })}\\n\\n\`);

    const keepAlive = setInterval(() => {
      try {
        res.write(': keepalive\\n\\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(clientId);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(clientId);
    });
    return;
  }

  return sendJson(req, res, 404, { ok: false, error: 'Endpoint nao encontrado' });
}

function findOpenSslBinary() {
  const candidates = [
    'openssl',
    'C:\\\\Program Files\\\\Git\\\\usr\\\\bin\\\\openssl.exe',
    'C:\\\\Program Files\\\\OpenSSL-Win64\\\\bin\\\\openssl.exe'
  ];
  for (const bin of candidates) {
    try {
      execFileSync(bin, ['version'], { stdio: 'ignore' });
      return bin;
    } catch {}
  }
  return null;
}

function ensureSelfSignedCertificate() {
  if (fs.existsSync(KEY_FILE) && fs.existsSync(CERT_FILE)) {
    return { key: fs.readFileSync(KEY_FILE), cert: fs.readFileSync(CERT_FILE) };
  }
  const opensslBin = findOpenSslBinary();
  if (!opensslBin) return null;

  const ips = getLanIpv4Addresses();
  const sanEntries = ['DNS:localhost', 'IP:127.0.0.1', ...ips.map((ip) => \`IP:\${ip}\`)].join(',');
  const cnfFile = path.join(CONFIG.dataDir, 'hub-openssl.cnf');
  fs.writeFileSync(
    cnfFile,
    \`[req]\\ndistinguished_name=req_dn\\nx509_extensions=v3_ext\\nprompt=no\\n[req_dn]\\nCN=Agil OS LAN Hub\\n[v3_ext]\\nsubjectAltName=\${sanEntries}\\nbasicConstraints=CA:FALSE\\nkeyUsage=digitalSignature,keyEncipherment\\nextendedKeyUsage=serverAuth\\n\`,
    'utf8'
  );
  try {
    execFileSync(opensslBin, [
      'req', '-x509', '-newkey', 'rsa:2048', '-sha256', '-days', '825', '-nodes',
      '-keyout', KEY_FILE, '-out', CERT_FILE, '-config', cnfFile
    ], { stdio: 'ignore' });
    return { key: fs.readFileSync(KEY_FILE), cert: fs.readFileSync(CERT_FILE) };
  } catch {
    return null;
  }
}

const httpServer = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    sendJson(req, res, 500, { ok: false, error: err?.message || 'Erro interno no Hub LAN' });
  });
});

let httpsServer = null;
if (!CONFIG.disableHttps) {
  const creds = ensureSelfSignedCertificate();
  if (creds) {
    httpsServer = https.createServer(creds, (req, res) => {
      handleRequest(req, res).catch((err) => {
        sendJson(req, res, 500, { ok: false, error: err?.message || 'Erro interno no Hub LAN' });
      });
    });
    httpsServer.listen(CONFIG.httpsPort, '0.0.0.0', () => {
      httpsEnabled = true;
      console.log(\`[Hub LAN] HTTPS ativo na porta \${CONFIG.httpsPort} (para acesso de outros PCs na rede)\`);
    });
  }
}

httpServer.listen(CONFIG.port, '0.0.0.0', () => {
  const ips = getLanIpv4Addresses();
  console.log('====================================================================');
  console.log(\` Agil OS LAN Hub iniciado para: \${CONFIG.companyName}\`);
  console.log(\` Este PC (HTTP):  http://localhost:\${CONFIG.port}\`);
  for (const ip of ips) {
    console.log(\` Outros PCs:      \${httpsEnabled ? \`https://\${ip}:\${CONFIG.httpsPort}\` : \`http://\${ip}:\${CONFIG.port}\`}\`);
  }
  console.log(\` Dados salvos em: \${CONFIG.dataDir}\`);
  console.log('====================================================================');
});

function shutdown() {
  try { saveStateAtomic(); } catch {}
  httpServer.close();
  if (httpsServer) httpsServer.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
`;
}

export function generateWindowsHubInstaller(config: LanHubGeneratorConfig): string {
  const port = Number(config.port) || 4321;
  const httpsPort = Number(config.httpsPort) || port + 1;
  const script = generateLanHubScript(config);
  const b64 = encodeUtf8ToBase64(script);
  const chunks = b64.match(/.{1,120}/g) || [];
  const psLines = chunks.map((c) => `>> "%HUB_DIR%\\hub.b64" echo ${c}`).join('\r\n');

  return `@echo off
setlocal enableextensions
title Instalador Hub Local LAN - Agil OS

echo ============================================================================
echo   AGIL OS - INSTALADOR DO HUB LOCAL LAN (NIVEL 2 HIBRIDO)
echo   Empresa: ${config.companyName.replace(/["&|<>^]/g, '')}
echo ============================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [AVISO] Node.js nao encontrado neste computador.
  where winget >nul 2>nul
  if %errorlevel% equ 0 (
    echo Tentando instalar Node.js LTS automaticamente via winget...
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  ) else (
    echo Instale o Node.js LTS em https://nodejs.org e execute este instalador novamente.
    pause
    exit /b 1
  )
)

set "HUB_DIR=%LOCALAPPDATA%\\AgilOS-Hub"
if not exist "%HUB_DIR%" mkdir "%HUB_DIR%"

if exist "%HUB_DIR%\\hub.b64" del /q "%HUB_DIR%\\hub.b64"
${psLines}

powershell -NoProfile -Command "[System.IO.File]::WriteAllBytes('%HUB_DIR%\\agilos-lan-hub.mjs', [System.Convert]::FromBase64String((Get-Content -Raw '%HUB_DIR%\\hub.b64')))"
del /q "%HUB_DIR%\\hub.b64"

> "%HUB_DIR%\\Iniciar-Hub-AgilOS.bat" echo @echo off
>> "%HUB_DIR%\\Iniciar-Hub-AgilOS.bat" echo title Agil OS - Hub Local LAN (Porta ${port} / ${httpsPort})
>> "%HUB_DIR%\\Iniciar-Hub-AgilOS.bat" echo cd /d "%HUB_DIR%"
>> "%HUB_DIR%\\Iniciar-Hub-AgilOS.bat" echo node "%HUB_DIR%\\agilos-lan-hub.mjs"

set "STARTUP_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
> "%STARTUP_DIR%\\AgilOS-LAN-Hub.bat" echo @echo off
>> "%STARTUP_DIR%\\AgilOS-LAN-Hub.bat" echo start "" /min cmd /c "%HUB_DIR%\\Iniciar-Hub-AgilOS.bat"

netsh advfirewall firewall add rule name="Agil OS LAN Hub HTTP" dir=in action=allow protocol=TCP localport=${port} >nul 2>nul
netsh advfirewall firewall add rule name="Agil OS LAN Hub HTTPS" dir=in action=allow protocol=TCP localport=${httpsPort} >nul 2>nul

echo.
echo [OK] Hub Local instalado em: %HUB_DIR%
echo [OK] Inicializacao automatica adicionada ao Windows Startup.
echo [OK] Iniciando o Hub Local agora...
start "Agil OS LAN Hub" cmd /k "%HUB_DIR%\\Iniciar-Hub-AgilOS.bat"
echo.
echo Agora no Agil OS (Empresa ^> Sincronizacao):
echo  - Neste PC servidor: http://localhost:${port}
echo  - Nos outros PCs da rede: veja o endereco https://IP_DESTE_PC:${httpsPort} na janela do Hub!
echo.
pause
`;
}

export function generateUnixHubInstaller(config: LanHubGeneratorConfig): string {
  const port = Number(config.port) || 4321;
  const httpsPort = Number(config.httpsPort) || port + 1;
  const script = generateLanHubScript(config);
  const b64 = encodeUtf8ToBase64(script);

  return `#!/usr/bin/env bash
set -euo pipefail

echo "============================================================================"
echo "  AGIL OS - INSTALADOR DO HUB LOCAL LAN (LINUX / MACOS)"
echo "============================================================================"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js 18+ nao encontrado. Instale o Node.js em https://nodejs.org e execute novamente."
  exit 1
fi

HUB_DIR="\${HOME}/.agilos-hub"
mkdir -p "\${HUB_DIR}"

cat << 'EOF_B64' | base64 -d > "\${HUB_DIR}/agilos-lan-hub.mjs"
${b64}
EOF_B64

chmod +x "\${HUB_DIR}/agilos-lan-hub.mjs"

echo "[OK] Hub instalado em: \${HUB_DIR}/agilos-lan-hub.mjs"
echo "[OK] Iniciando em segundo plano (portas ${port} HTTP / ${httpsPort} HTTPS)..."
nohup node "\${HUB_DIR}/agilos-lan-hub.mjs" > "\${HUB_DIR}/hub.log" 2>&1 &
echo "PID: $!"
echo "Logs em: \${HUB_DIR}/hub.log"
`;
}
