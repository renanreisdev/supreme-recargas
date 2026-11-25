'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Server,
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  KeyRound,
  Monitor,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Check
} from 'lucide-react';
import { AppStore, OfflineMutation } from '@/lib/store';
import { CompanySettings, LanHubHealthStatus, SyncOperationMode } from '@/types';
import {
  generateLanHubScript,
  generateLanHubToken,
  generateUnixHubInstaller,
  generateWindowsHubInstaller
} from '@/lib/lan-hub-generator';
import {
  getTerminalSyncConfig,
  saveTerminalSyncConfig,
  testLanHubConnection,
  resolveEffectiveHubUrl
} from '@/lib/lan-hub-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';

interface SyncSettingsTabProps {
  tenantId: string;
  companyName: string;
  settings: CompanySettings;
  performedByName?: string;
  onSettingsUpdated: (updated: CompanySettings) => void;
}

function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SyncSettingsTab({
  tenantId,
  companyName,
  settings,
  performedByName,
  onSettingsUpdated
}: SyncSettingsTabProps) {
  const [mode, setMode] = useState<SyncOperationMode>(settings.sync_operation_mode || 'CLOUD_ONLY');
  const [lanHubUrl, setLanHubUrl] = useState(settings.lan_hub_url || '');
  const [lanHubToken, setLanHubToken] = useState(() => settings.lan_hub_token || generateLanHubToken());
  const [lanHubPort, setLanHubPort] = useState(String(settings.lan_hub_port ?? 4321));
  const [autoFallback, setAutoFallback] = useState(settings.lan_hub_auto_fallback ?? true);

  const [terminalLabel, setTerminalLabel] = useState('Computador 01');
  const [terminalId, setTerminalId] = useState('');
  const [localOverrideUrl, setLocalOverrideUrl] = useState('');

  const [syncStatus, setSyncStatus] = useState(() => AppStore.getSyncStatus());
  const [queueItems, setQueueItems] = useState<OfflineMutation[]>(() => AppStore.getOfflineQueue());
  const [isTestingHub, setIsTestingHub] = useState(false);
  const [hubHealth, setHubHealth] = useState<LanHubHealthStatus | null>(null);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const refreshQueueAndStatus = () => {
    setSyncStatus(AppStore.getSyncStatus());
    setQueueItems(AppStore.getOfflineQueue());
  };

  useEffect(() => {
    const term = getTerminalSyncConfig();
    setTerminalId(term.terminalId);
    setTerminalLabel(term.terminalLabel || 'Computador 01');
    setLocalOverrideUrl(term.localHubUrlOverride || '');
  }, []);

  useEffect(() => {
    setMode(settings.sync_operation_mode || 'CLOUD_ONLY');
    setLanHubUrl(settings.lan_hub_url || '');
    if (settings.lan_hub_token) {
      setLanHubToken(settings.lan_hub_token);
    }
    setLanHubPort(String(settings.lan_hub_port ?? 4321));
    setAutoFallback(settings.lan_hub_auto_fallback ?? true);
  }, [settings]);

  useEffect(() => {
    refreshQueueAndStatus();
    const onSyncUpdate = () => refreshQueueAndStatus();
    window.addEventListener('supreme_sync_status_updated', onSyncUpdate);
    window.addEventListener('online', onSyncUpdate);
    window.addEventListener('offline', onSyncUpdate);
    return () => {
      window.removeEventListener('supreme_sync_status_updated', onSyncUpdate);
      window.removeEventListener('online', onSyncUpdate);
      window.removeEventListener('offline', onSyncUpdate);
    };
  }, []);

  const numericPort = Math.max(1024, Math.min(65530, parseInt(lanHubPort, 10) || 4321));
  const httpsPort = numericPort + 1;

  const persistCurrentConfig = (overrideMode?: SyncOperationMode) => {
    const effectiveMode = overrideMode || mode;
    saveTerminalSyncConfig({
      terminalLabel: terminalLabel.trim() || 'Computador Local',
      localHubUrlOverride: localOverrideUrl.trim()
    });

    const updated = AppStore.updateSettings(
      tenantId,
      {
        sync_operation_mode: effectiveMode,
        lan_hub_url: lanHubUrl.trim(),
        lan_hub_token: lanHubToken.trim() || generateLanHubToken(),
        lan_hub_port: numericPort,
        lan_hub_auto_fallback: autoFallback
      },
      performedByName || 'Administrador'
    );

    onSettingsUpdated(updated);
    refreshQueueAndStatus();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    return updated;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    persistCurrentConfig();
    toast.success('Configurações de sincronização e rede local salvas!');
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(lanHubToken);
    setCopiedToken(true);
    toast.success('Token do Hub copiado!');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleRegenerateToken = () => {
    const nextToken = generateLanHubToken();
    setLanHubToken(nextToken);
    toast.info('Novo token gerado! Lembre-se de salvar e reinstalar/atualizar o Hub se já estiver rodando.');
  };

  const handleDownloadInstaller = (kind: 'win' | 'unix' | 'mjs') => {
    // Garante que o token atual fique persistido na empresa antes de gerar o pacote
    const saved = persistCurrentConfig('HYBRID_LAN_HUB');
    setMode('HYBRID_LAN_HUB');
    const cfg = {
      tenantId,
      companyName,
      token: saved.lan_hub_token || lanHubToken,
      port: numericPort,
      httpsPort
    };

    if (kind === 'win') {
      downloadTextFile('Instalar-Hub-AgilOS.bat', generateWindowsHubInstaller(cfg));
      toast.success('Instalador Windows baixado! Execute no computador que ficará como Hub da loja.');
    } else if (kind === 'unix') {
      downloadTextFile('instalar-hub-agilos.sh', generateUnixHubInstaller(cfg));
      toast.success('Instalador Linux/macOS baixado!');
    } else {
      downloadTextFile('agilos-lan-hub.mjs', generateLanHubScript(cfg), 'application/javascript;charset=utf-8');
      toast.success('Script agilos-lan-hub.mjs baixado!');
    }
  };

  const handleTestHub = async () => {
    setIsTestingHub(true);
    setHubHealth(null);
    const targetUrl = localOverrideUrl.trim() || lanHubUrl.trim() || resolveEffectiveHubUrl(settings.lan_hub_url) || `http://localhost:${numericPort}`;
    const result = await testLanHubConnection(targetUrl, lanHubToken.trim());
    setHubHealth(result);
    setIsTestingHub(false);
    if (result.ok) {
      if (result.tokenValid === false) {
        toast.warning('Hub encontrado, mas o Token configurado neste PC está diferente do Hub!');
      } else {
        toast.success(`Hub Local conectado com sucesso (${result.latencyMs}ms)!`);
      }
    } else {
      toast.error(result.error || 'Não foi possível alcançar o Hub Local.');
    }
  };

  const handleSyncNow = async () => {
    if (isSyncingNow) return;
    setIsSyncingNow(true);
    try {
      const res = await AppStore.flushOfflineQueue();
      await AppStore.syncFromSupabase(tenantId);
      refreshQueueAndStatus();
      if (res.processed > 0) {
        toast.success(`${res.processed} alteração(ões) enviada(s) à nuvem!`);
      } else {
        toast.success('Sincronização concluída!');
      }
    } catch {
      toast.error('Falha ao conectar à nuvem. Suas alterações continuam salvas localmente.');
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleRetryMutation = async (id: string) => {
    await AppStore.retryConflictMutation(id);
    refreshQueueAndStatus();
    toast.info('Reenvio solicitado.');
  };

  const handleDiscardMutation = (id: string) => {
    AppStore.discardOfflineMutation(id);
    refreshQueueAndStatus();
    toast.warning('Pendência removida da fila local.');
  };

  const effectiveTestUrl = localOverrideUrl.trim() || lanHubUrl.trim() || `http://localhost:${numericPort}`;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span>Modo de Sincronização, Operação Offline & Rede Local (LAN)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha entre operação 100% Nuvem com Offline Blindado (Nível 1) ou sincronização local entre vários PCs sem internet (Nível 2).
            </p>
          </div>
          <Badge className={mode === 'HYBRID_LAN_HUB' ? 'bg-purple-600 text-white text-[10px]' : 'bg-emerald-600 text-white text-[10px]'}>
            {mode === 'HYBRID_LAN_HUB' ? 'Nível 2: Híbrido LAN + Nuvem' : 'Nível 1: Nuvem + Offline Blindado'}
          </Badge>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Configurações de sincronização atualizadas com sucesso!</span>
          </div>
        )}

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              mode === 'CLOUD_ONLY'
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="sync_operation_mode"
              value="CLOUD_ONLY"
              checked={mode === 'CLOUD_ONLY'}
              onChange={() => setMode('CLOUD_ONLY')}
              className="mt-1 text-emerald-600 focus:ring-emerald-500"
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Nível 1 — Nuvem + Offline Blindado (Padrão)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Não precisa instalar nada nos PCs. Cada computador salva localmente quando a internet cai, resolve colisões de número de OS automaticamente na volta e mantém os dados em nuvem + IndexedDB + PWA offline.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                <span>✓ Sem colisão de OS</span>
                <span>• ✓ Nunca descarta dados</span>
                <span>• ✓ Abre mesmo sem internet</span>
              </div>
            </div>
          </label>

          <label
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              mode === 'HYBRID_LAN_HUB'
                ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/20'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="sync_operation_mode"
              value="HYBRID_LAN_HUB"
              checked={mode === 'HYBRID_LAN_HUB'}
              onChange={() => setMode('HYBRID_LAN_HUB')}
              className="mt-1 text-purple-600 focus:ring-purple-500"
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Nível 2 — Híbrido Hub Local LAN + Nuvem
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Recomendado para assistências com 2+ computadores no balcão e bancada técnica: um PC da loja roda um pequeno Hub local que sincroniza OS e status pela rede Wi-Fi/cabo mesmo se a internet da rua cair 100%.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                <span>✓ Balcão → Bancada sem internet</span>
                <span>• ✓ Instalador 1-Clique</span>
              </div>
            </div>
          </label>
        </div>

        {/* Level 2 Installer & Configuration */}
        {mode === 'HYBRID_LAN_HUB' && (
          <div className="space-y-5 pt-2">
            {/* Step-by-step Easy Installer Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/70 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-purple-600" />
                    <span>Instalação Fácil do Hub Local (Em 3 Passos)</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Escolha <strong>1 computador principal da loja</strong> (ex.: Balcão 1) para rodar o Hub. Os outros PCs apenas conectam pelo endereço dele na rede interna.
                  </p>
                </div>
              </div>

              <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-700 dark:text-slate-300">
                <li className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/70 dark:border-purple-900/50 space-y-1">
                  <span className="font-black text-purple-600 block">1. Baixar e Executar no PC Servidor</span>
                  <span className="block text-slate-500 dark:text-slate-400">
                    Baixe o instalador abaixo no PC principal e dê duplo clique. Ele configura Node.js, porta {numericPort}/{httpsPort} e inicialização automática com o sistema.
                  </span>
                </li>
                <li className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/70 dark:border-purple-900/50 space-y-1">
                  <span className="font-black text-purple-600 block">2. Copiar o Endereço LAN da Janela</span>
                  <span className="block text-slate-500 dark:text-slate-400">
                    Ao abrir, o Hub mostra o IP da rede (ex.: <code className="font-mono text-purple-700 dark:text-purple-300">https://192.168.0.10:{httpsPort}</code>). Cole abaixo como Endereço Padrão da Empresa.
                  </span>
                </li>
                <li className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/70 dark:border-purple-900/50 space-y-1">
                  <span className="font-black text-purple-600 block">3. Testar & Conectar nos 3 PCs</span>
                  <span className="block text-slate-500 dark:text-slate-400">
                    Salve, clique em <strong>Testar Conexão</strong> em cada PC da assistência (se usar HTTPS local na 1ª vez, aceite o certificado local) e pronto!
                  </span>
                </li>
              </ol>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button
                  type="button"
                  onClick={() => handleDownloadInstaller('win')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 h-9 rounded-xl shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Instalador Windows (.bat)</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDownloadInstaller('unix')}
                  className="text-xs font-bold gap-1.5 h-9 rounded-xl border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalador Linux / Mac (.sh)</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDownloadInstaller('mjs')}
                  className="text-xs font-bold gap-1.5 h-9 rounded-xl"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Somente Script Node (.mjs)</span>
                </Button>
              </div>
            </div>

            {/* Connection & Token Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-purple-600" />
                  <span>Parâmetros da Empresa (Compartilhado na Nuvem)</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                    Endereço Padrão do Hub na Rede Local
                  </label>
                  <Input
                    value={lanHubUrl}
                    onChange={e => setLanHubUrl(e.target.value)}
                    placeholder={`Ex: https://192.168.1.50:${httpsPort} ou http://localhost:${numericPort}`}
                    className="text-xs font-mono rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400">
                    Para acessar de outros computadores via HTTPS (agilos.supremeapps.com.br), prefira o endereço <code className="font-mono">https://IP-DO-SERVIDOR:{httpsPort}</code> exibido pelo Hub.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Porta HTTP
                    </label>
                    <Input
                      type="number"
                      min="1024"
                      max="65530"
                      value={lanHubPort}
                      onChange={e => setLanHubPort(e.target.value)}
                      className="text-xs font-mono rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Token de Segurança da Rede
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={lanHubToken}
                        onChange={e => setLanHubToken(e.target.value)}
                        className="text-xs font-mono rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyToken}
                        title="Copiar Token"
                        className="h-9 px-2.5 rounded-xl shrink-0"
                      >
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateToken}
                        title="Gerar Novo Token"
                        className="h-9 px-2.5 rounded-xl shrink-0"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoFallback}
                    onChange={e => setAutoFallback(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>Fallback automático: continuar operando normalmente se o Hub estiver offline</span>
                </label>
              </div>

              {/* This Terminal Override Settings */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                  <span>Identificação Deste Computador (Terminal)</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                    Nome deste Terminal (Ex.: Balcão 1, Balcão 2, Bancada Técnica)
                  </label>
                  <Input
                    value={terminalLabel}
                    onChange={e => setTerminalLabel(e.target.value)}
                    placeholder="Ex: Balcão 1"
                    className="text-xs rounded-xl"
                  />
                  <span className="text-[10px] font-mono text-slate-400">
                    ID do navegador: {terminalId || 'inicializando...'}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                    Endereço Exclusivo Deste PC (Opcional — sobrescreve o padrão)
                  </label>
                  <Input
                    value={localOverrideUrl}
                    onChange={e => setLocalOverrideUrl(e.target.value)}
                    placeholder={`No PC servidor use: http://localhost:${numericPort}`}
                    className="text-xs font-mono rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400">
                    Dica: No próprio PC onde o Hub está rodando, preencha <code className="font-mono">http://localhost:{numericPort}</code>. Nos demais PCs, deixe vazio para usar o endereço padrão da empresa.
                  </p>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestHub}
                    disabled={isTestingHub}
                    className="text-xs font-bold gap-1.5 h-9 rounded-xl border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingHub ? 'animate-spin' : ''}`} />
                    <span>{isTestingHub ? 'Testando...' : 'Testar Conexão com o Hub'}</span>
                  </Button>
                </div>

                {hubHealth && (
                  <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
                    hubHealth.ok
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}>
                    {hubHealth.ok ? (
                      <>
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Hub Conectado ({hubHealth.latencyMs}ms) — Revisão #{hubHealth.revision}</span>
                        </div>
                        <div className="font-mono text-[10px]">
                          IPs LAN: {(hubHealth.lanIps || []).join(', ') || 'localhost'} • Terminais SSE: {hubHealth.connectedClients?.length || 0}
                        </div>
                        {hubHealth.tokenValid === false && (
                          <div className="text-amber-700 dark:text-amber-300 font-bold">
                            Aviso: O token neste navegador difere do token rodando no Hub.
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{hubHealth.error}</span>
                        </div>
                        {hubHealth.needsCertTrust && (
                          <a
                            href={`${effectiveTestUrl}/api/health`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 underline font-bold mt-1"
                          >
                            <span>Abrir {effectiveTestUrl} para aceitar o certificado local</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl h-9 shadow-xs">
            <Check className="w-4 h-4" />
            <span>Salvar Modo e Configurações de Sincronização</span>
          </Button>
        </div>
      </form>

      {/* Sync Health & Conflict Queue Inspector */}
      <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Painel de Saúde da Sincronização & Fila Local</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Nenhuma alteração é descartada em caso de queda de internet. Pendências ou conflitos ficam salvos até serem confirmados na nuvem.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncNow}
            disabled={isSyncingNow}
            className="text-xs font-bold gap-1.5 h-9 rounded-xl shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
            <span>{isSyncingNow ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
          </Button>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Internet / Nuvem</span>
              <span className={`font-bold flex items-center gap-1.5 mt-1 ${syncStatus.isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                {syncStatus.isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span>{syncStatus.isOnline ? 'Online' : 'Offline'}</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Hub Local LAN</span>
              <span className={`font-bold flex items-center gap-1.5 mt-1 ${
                syncStatus.mode !== 'HYBRID_LAN_HUB'
                  ? 'text-slate-400'
                  : syncStatus.lanHubConnected
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-amber-600'
              }`}>
                <Server className="w-3.5 h-3.5" />
                <span>
                  {syncStatus.mode !== 'HYBRID_LAN_HUB'
                    ? 'Desativado (Nível 1)'
                    : syncStatus.lanHubConnected
                      ? `Conectado (${syncStatus.lanHubClients} PCs)`
                      : 'Desconectado'}
                </span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Fila Pendente</span>
              <span className="font-mono font-black text-base text-slate-900 dark:text-white mt-0.5 block">
                {syncStatus.pendingCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Conflitos Manuais</span>
              <span className={`font-mono font-black text-base mt-0.5 block ${syncStatus.conflictCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {syncStatus.conflictCount}
              </span>
            </div>
          </div>

          {queueItems.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              Todas as operações deste computador já estão 100% sincronizadas com a nuvem.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Tabela</th>
                    <th className="py-2.5 px-3">Ação</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Tentativas / Detalhe</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {queueItems.map(item => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{item.table}</td>
                      <td className="py-2.5 px-3">{item.action}</td>
                      <td className="py-2.5 px-3">
                        <Badge className={item.status === 'CONFLICT' ? 'bg-rose-600 text-white text-[10px]' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]'}>
                          {item.status === 'CONFLICT' ? 'Conflito' : 'Pendente'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                        {item.retry_count}x{item.last_error ? ` — ${item.last_error}` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryMutation(item.id)}
                          className="h-7 px-2 text-[11px]"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reenviar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDiscardMutation(item.id)}
                          className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
