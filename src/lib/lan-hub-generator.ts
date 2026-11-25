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
import crypto from 'node:crypto';
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

function derLen(len) {
  if (len < 128) return Buffer.from([len]);
  const bytes = [];
  let n = len;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>= 8;
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function derTag(tag, buf) {
  return Buffer.concat([Buffer.from([tag]), derLen(buf.length), buf]);
}

function derSeq(...items) {
  return derTag(0x30, Buffer.concat(items));
}

function derSet(...items) {
  return derTag(0x31, Buffer.concat(items));
}

function derOctet(buf) {
  return derTag(0x04, buf);
}

function derBitString(buf) {
  return derTag(0x03, Buffer.concat([Buffer.from([0x00]), buf]));
}

function derInt(buf) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from([buf]);
  if (b[0] & 0x80) {
    return derTag(0x02, Buffer.concat([Buffer.from([0x00]), b]));
  }
  return derTag(0x02, b);
}

function derOid(oid) {
  const parts = oid.split('.').map(Number);
  const out = [parts[0] * 40 + parts[1]];
  for (let i = 2; i < parts.length; i++) {
    let v = parts[i];
    const stack = [v & 0x7f];
    v >>= 7;
    while (v > 0) {
      stack.unshift((v & 0x7f) | 0x80);
      v >>= 7;
    }
    out.push(...stack);
  }
  return derTag(0x06, Buffer.from(out));
}

function derUtf8(str) {
  return derTag(0x0c, Buffer.from(str, 'utf8'));
}

function derUtcTime(date) {
  const p = (n) => String(n).padStart(2, '0');
  const yy = String(date.getUTCFullYear()).slice(-2);
  const s = yy + p(date.getUTCMonth() + 1) + p(date.getUTCDate()) + p(date.getUTCHours()) + p(date.getUTCMinutes()) + p(date.getUTCSeconds()) + 'Z';
  return derTag(0x17, Buffer.from(s, 'ascii'));
}

function ensureSelfSignedCertificate() {
  try {
    if (fs.existsSync(KEY_FILE) && fs.existsSync(CERT_FILE)) {
      return { key: fs.readFileSync(KEY_FILE), cert: fs.readFileSync(CERT_FILE) };
    }

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    const serialBytes = crypto.randomBytes(12);
    serialBytes[0] = (serialBytes[0] & 0x7f) || 0x01;

    const sigAlg = derSeq(derOid('1.2.840.113549.1.1.11'), Buffer.from([0x05, 0x00]));
    const name = derSeq(derSet(derSeq(derOid('2.5.4.3'), derUtf8('Agil OS LAN Hub'))));

    const notBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const notAfter = new Date(Date.now() + 820 * 24 * 60 * 60 * 1000);
    const validity = derSeq(derUtcTime(notBefore), derUtcTime(notAfter));

    const allIps = Array.from(new Set(['127.0.0.1', ...getLanIpv4Addresses()]));
    const sanItems = [
      derTag(0x82, Buffer.from('localhost', 'ascii')),
      ...allIps.map((ip) => derTag(0x87, Buffer.from(ip.split('.').map(Number))))
    ];

    const extBasicConstraints = derSeq(derOid('2.5.29.19'), Buffer.from([0x01, 0x01, 0xff]), derOctet(derSeq()));
    const extKeyUsage = derSeq(derOid('2.5.29.15'), Buffer.from([0x01, 0x01, 0xff]), derOctet(Buffer.from([0x03, 0x02, 0x05, 0xa0])));
    const extServerAuth = derSeq(derOid('2.5.29.37'), derOctet(derSeq(derOid('1.3.6.1.5.5.7.3.1'))));
    const extSan = derSeq(derOid('2.5.29.17'), derOctet(derSeq(...sanItems)));

    const extensionsWrapper = derTag(0xa3, derSeq(extBasicConstraints, extKeyUsage, extServerAuth, extSan));

    const tbs = derSeq(
      derTag(0xa0, derInt(2)),
      derInt(serialBytes),
      sigAlg,
      name,
      validity,
      name,
      publicKey,
      extensionsWrapper
    );

    const signature = crypto.sign('sha256', tbs, privateKey);
    const certDer = derSeq(tbs, sigAlg, derBitString(signature));
    const b64Lines = certDer.toString('base64').match(/.{1,64}/g)?.join('\\n') || '';
    const certPem = \`-----BEGIN CERTIFICATE-----\\n\${b64Lines}\\n-----END CERTIFICATE-----\\n\`;

    fs.writeFileSync(KEY_FILE, privateKey, 'utf8');
    fs.writeFileSync(CERT_FILE, certPem, 'utf8');
    return { key: Buffer.from(privateKey, 'utf8'), cert: Buffer.from(certPem, 'utf8') };
  } catch (err) {
    console.warn('[Hub] Nao foi possivel gerar certificado HTTPS local:', err?.message);
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

export function buildWindowsSetupPowerShell(): string {
  return `param(
  [Parameter(Mandatory = $true)][string]$HubDir,
  [int]$HttpPort = 4321,
  [int]$HttpsPort = 4322
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$RuntimeDir = Join-Path $HubDir 'runtime'
$LocalNode = Join-Path $RuntimeDir 'node.exe'
$NodeBin = $null

function Test-NodeMajor($ExePath) {
  try {
    if (-not $ExePath) { return 0 }
    $ver = & $ExePath -v 2>$null
    if ($ver -match '^v(\\d+)\\.') { return [int]$Matches[1] }
  } catch {}
  return 0
}

if ((Test-Path $LocalNode) -and (Test-NodeMajor $LocalNode) -ge 18) {
  $NodeBin = $LocalNode
  Write-Host '[OK] Runtime portatil do Hub ja presente.' -ForegroundColor Green
} else {
  $sysCmd = Get-Command node -ErrorAction SilentlyContinue
  $pfNode = Join-Path $env:ProgramFiles 'nodejs\\node.exe'
  if ($sysCmd -and (Test-NodeMajor $sysCmd.Source) -ge 18) {
    $NodeBin = $sysCmd.Source
    Write-Host "[OK] Node.js do sistema detectado ($NodeBin)." -ForegroundColor Green
  } elseif ((Test-Path $pfNode) -and (Test-NodeMajor $pfNode) -ge 18) {
    $NodeBin = $pfNode
    Write-Host "[OK] Node.js detectado em Arquivos de Programas." -ForegroundColor Green
  }
}

if (-not $NodeBin) {
  Write-Host '[1/3] Baixando runtime portatil oficial Node.js v22 LTS (nao altera o Windows)...' -ForegroundColor Cyan
  $arch = 'win-x64'
  if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') {
    $arch = 'win-arm64'
  } elseif (-not [Environment]::Is64BitOperatingSystem) {
    $arch = 'win-x86'
  }

  $sumsUrl = 'https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt'
  $sumsText = (Invoke-WebRequest -Uri $sumsUrl -UseBasicParsing).Content
  $targetLine = ($sumsText -split "\`n") | Where-Object { $_ -match ("^([0-9a-fA-F]{64})\\s+(node-v22\\.[0-9.]+-" + $arch + "\\.zip)\\s*$") } | Select-Object -First 1

  if (-not $targetLine) {
    throw "Nao foi possivel localizar o pacote Node.js oficial para $arch em latest-v22.x/SHASUMS256.txt"
  }

  $null = $targetLine -match "^([0-9a-fA-F]{64})\\s+(node-v22\\.[0-9.]+-$arch\\.zip)"
  $expectedHash = $Matches[1].ToLower()
  $zipName = $Matches[2]
  $zipUrl = "https://nodejs.org/dist/latest-v22.x/$zipName"
  $zipPath = Join-Path $env:TEMP $zipName
  $extractTemp = Join-Path $env:TEMP ('agilos_node_' + [guid]::NewGuid().ToString('N'))

  Write-Host "      Pacote: $zipName" -ForegroundColor Gray
  Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing

  $actualHash = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash.ToLower()
  if ($actualHash -ne $expectedHash) {
    Remove-Item -Force $zipPath -ErrorAction SilentlyContinue
    throw "Falha na verificacao de integridade SHA-256 do Node.js ($actualHash != $expectedHash)."
  }

  Write-Host '[2/3] Extraindo runtime portatil...' -ForegroundColor Cyan
  if (Test-Path $RuntimeDir) { Remove-Item -Recurse -Force $RuntimeDir }
  New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $extractTemp -Force
  $innerDir = Get-ChildItem -Path $extractTemp -Directory | Select-Object -First 1
  Copy-Item -Path (Join-Path $innerDir.FullName '*') -Destination $RuntimeDir -Recurse -Force

  Remove-Item -Force $zipPath -ErrorAction SilentlyContinue
  Remove-Item -Recurse -Force $extractTemp -ErrorAction SilentlyContinue

  if (-not (Test-Path $LocalNode)) {
    throw 'Extracao concluida, mas node.exe nao foi encontrado.'
  }
  $NodeBin = $LocalNode
  Write-Host '[OK] Runtime portatil pronto!' -ForegroundColor Green
}

# Encerrar eventual instancia anterior do Hub antes de reiniciar com a nova configuracao
try {
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*agilos-lan-hub.mjs*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
} catch {}

# Gerar scripts de execucao e autostart usando o Node resolvido
$StartBat = Join-Path $HubDir 'Iniciar-Hub-AgilOS.bat'
$StartBatContent = @"
@echo off
title Agil OS - Hub Local LAN (Porta $HttpPort / $HttpsPort)
cd /d "%~dp0"
if exist "%~dp0runtime\\node.exe" (
  "%~dp0runtime\\node.exe" "%~dp0agilos-lan-hub.mjs"
) else (
  "$NodeBin" "%~dp0agilos-lan-hub.mjs"
)
"@
[System.IO.File]::WriteAllText($StartBat, $StartBatContent, [System.Text.Encoding]::ASCII)

$StartupDir = [Environment]::GetFolderPath('Startup')
$StartupBat = Join-Path $StartupDir 'AgilOS-LAN-Hub.bat'
$StartupBatContent = @"
@echo off
start "" /min cmd /c "$StartBat"
"@
[System.IO.File]::WriteAllText($StartupBat, $StartupBatContent, [System.Text.Encoding]::ASCII)

# Liberar firewall se possivel (silencioso sem exigir UAC)
try {
  netsh advfirewall firewall delete rule name="Agil OS LAN Hub HTTP" *> $null
  netsh advfirewall firewall delete rule name="Agil OS LAN Hub HTTPS" *> $null
  netsh advfirewall firewall add rule name="Agil OS LAN Hub HTTP" dir=in action=allow protocol=TCP localport=$HttpPort *> $null
  netsh advfirewall firewall add rule name="Agil OS LAN Hub HTTPS" dir=in action=allow protocol=TCP localport=$HttpsPort *> $null
} catch {}

Write-Host '[3/3] Iniciando Hub Local LAN do Agil OS...' -ForegroundColor Cyan
Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "\`"$StartBat\`""

$health = $null
for ($i = 0; $i -lt 25; $i++) {
  Start-Sleep -Milliseconds 400
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$HttpPort/api/health" -TimeoutSec 2 -ErrorAction Stop
    if ($health.ok) { break }
  } catch {}
}

Write-Host ''
if ($health -and $health.ok) {
  Write-Host '====================================================================' -ForegroundColor Green
  Write-Host ' HUB LOCAL AGIL OS INSTALADO E RODANDO!' -ForegroundColor Green
  Write-Host " - Neste PC:       http://localhost:$HttpPort" -ForegroundColor White
  foreach ($ip in $health.lanIps) {
    if ($health.httpsEnabled) {
      Write-Host " - Outros PCs:     https://$($ip):$HttpsPort" -ForegroundColor Yellow
    } else {
      Write-Host " - Outros PCs:     http://$($ip):$HttpPort" -ForegroundColor Yellow
    }
  }
  Write-Host '====================================================================' -ForegroundColor Green
  Start-Process "http://localhost:$HttpPort"
} else {
  Write-Host '[AVISO] O Hub foi iniciado na janela separada. Confira os enderecos exibidos nela.' -ForegroundColor Yellow
}
`;
}

export function generateWindowsHubInstaller(config: LanHubGeneratorConfig): string {
  const port = Number(config.port) || 4321;
  const httpsPort = Number(config.httpsPort) || port + 1;
  const script = generateLanHubScript(config);
  const setupPs1 = buildWindowsSetupPowerShell();

  const hubB64 = encodeUtf8ToBase64(script);
  const setupB64 = encodeUtf8ToBase64(setupPs1);

  const hubChunks = (hubB64.match(/.{1,120}/g) || []).map((c) => `>> "%HUB_DIR%\\hub.b64" echo ${c}`).join('\r\n');
  const setupChunks = (setupB64.match(/.{1,120}/g) || []).map((c) => `>> "%HUB_DIR%\\setup.b64" echo ${c}`).join('\r\n');

  return `@echo off
setlocal enableextensions
title Instalador Hub Local LAN - Agil OS

echo ============================================================================
echo   AGIL OS - INSTALADOR AUTOMATICO DO HUB LOCAL LAN (NIVEL 2)
echo   Empresa: ${config.companyName.replace(/["&|<>^%]/g, '')}
echo   Nao precisa ter nada instalado: runtime + HTTPS local incluidos!
echo ============================================================================
echo.

set "HUB_DIR=%LOCALAPPDATA%\\AgilOS-Hub"
if not exist "%HUB_DIR%" mkdir "%HUB_DIR%"

if exist "%HUB_DIR%\\hub.b64" del /q "%HUB_DIR%\\hub.b64"
${hubChunks}

if exist "%HUB_DIR%\\setup.b64" del /q "%HUB_DIR%\\setup.b64"
${setupChunks}

powershell -NoProfile -ExecutionPolicy Bypass -Command "[System.IO.File]::WriteAllBytes('%HUB_DIR%\\agilos-lan-hub.mjs', [System.Convert]::FromBase64String((Get-Content -Raw '%HUB_DIR%\\hub.b64'))); [System.IO.File]::WriteAllBytes('%HUB_DIR%\\setup-hub.ps1', [System.Convert]::FromBase64String((Get-Content -Raw '%HUB_DIR%\\setup.b64')))"
if %errorlevel% neq 0 (
  echo [ERRO] Nao foi possivel extrair os arquivos do instalador.
  pause
  exit /b 1
)

del /q "%HUB_DIR%\\hub.b64"
del /q "%HUB_DIR%\\setup.b64"

powershell -NoProfile -ExecutionPolicy Bypass -File "%HUB_DIR%\\setup-hub.ps1" -HubDir "%HUB_DIR%" -HttpPort ${port} -HttpsPort ${httpsPort}
if %errorlevel% neq 0 (
  echo.
  echo [ERRO] Ocorreu um problema durante a configuracao automatica.
  pause
  exit /b 1
)

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
echo "  AGIL OS - INSTALADOR AUTOMATICO DO HUB LOCAL LAN (LINUX / MACOS)"
echo "============================================================================"

HUB_DIR="\${HOME}/.agilos-hub"
RUNTIME_DIR="\${HUB_DIR}/runtime"
mkdir -p "\${HUB_DIR}"

NODE_BIN=""
if [ -x "\${RUNTIME_DIR}/bin/node" ]; then
  NODE_BIN="\${RUNTIME_DIR}/bin/node"
elif command -v node >/dev/null 2>&1; then
  MAJOR_VER=\$(node -v | sed -E 's/^v([0-9]+).*/\\1/')
  if [ "\${MAJOR_VER:-0}" -ge 18 ]; then
    NODE_BIN=\$(command -v node)
  fi
fi

if [ -z "\${NODE_BIN}" ]; then
  echo "[1/3] Baixando runtime portatil oficial Node.js v22 LTS..."
  UNAME_S=\$(uname -s | tr '[:upper:]' '[:lower:]')
  UNAME_M=\$(uname -m)
  case "\${UNAME_S}-\${UNAME_M}" in
    linux-x86_64) PLAT="linux-x64" ;;
    linux-aarch64|linux-arm64) PLAT="linux-arm64" ;;
    darwin-arm64) PLAT="darwin-arm64" ;;
    darwin-x86_64) PLAT="darwin-x64" ;;
    *) echo "[ERRO] Arquitetura nao suportada automaticamente: \${UNAME_S}-\${UNAME_M}"; exit 1 ;;
  esac

  SHASUMS=\$(curl -fsSL "https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt")
  MATCH_LINE=\$(echo "\${SHASUMS}" | grep -E "node-v22\\.[0-9.]+-\${PLAT}\\.tar\\.gz$" | head -n1)
  EXPECTED_SHA=\$(echo "\${MATCH_LINE}" | awk '{print \$1}')
  TAR_NAME=\$(echo "\${MATCH_LINE}" | awk '{print \$2}')

  TMP_TAR="/tmp/\${TAR_NAME}"
  curl -fsSL "https://nodejs.org/dist/latest-v22.x/\${TAR_NAME}" -o "\${TMP_TAR}"
  if command -v sha256sum >/dev/null 2>&1; then
    ACTUAL_SHA=\$(sha256sum "\${TMP_TAR}" | awk '{print \$1}')
  else
    ACTUAL_SHA=\$(shasum -a 256 "\${TMP_TAR}" | awk '{print \$1}')
  fi
  [ "\${ACTUAL_SHA}" = "\${EXPECTED_SHA}" ] || { echo "[ERRO] Falha SHA-256"; rm -f "\${TMP_TAR}"; exit 1; }

  rm -rf "\${RUNTIME_DIR}" && mkdir -p "\${RUNTIME_DIR}"
  tar -xzf "\${TMP_TAR}" --strip-components=1 -C "\${RUNTIME_DIR}"
  rm -f "\${TMP_TAR}"
  NODE_BIN="\${RUNTIME_DIR}/bin/node"
fi

cat << 'EOF_B64' | base64 -d > "\${HUB_DIR}/agilos-lan-hub.mjs"
${b64}
EOF_B64

chmod +x "\${HUB_DIR}/agilos-lan-hub.mjs"

pkill -f "agilos-lan-hub.mjs" >/dev/null 2>&1 || true
echo "[OK] Hub instalado em: \${HUB_DIR}/agilos-lan-hub.mjs"
echo "[OK] Iniciando em segundo plano (portas ${port} HTTP / ${httpsPort} HTTPS)..."
nohup "\${NODE_BIN}" "\${HUB_DIR}/agilos-lan-hub.mjs" > "\${HUB_DIR}/hub.log" 2>&1 &
echo "PID: $!"
echo "Logs em: \${HUB_DIR}/hub.log"
`;
}
