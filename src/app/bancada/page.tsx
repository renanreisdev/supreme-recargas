'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Scale, 
  Clock, 
  User, 
  FileText, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  Filter,
  ShieldAlert,
  Info,
  Droplets,
  AlertOctagon,
  CheckCircle,
  ThumbsUp
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { Cartridge, CartridgeStatus, ResultClassification, CompanySettings } from '@/types';
import { formatCurrency, formatWeight, getStatusBadgeConfig, getResultBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function TechnicianWorkbenchPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));
  const [searchFilter, setSearchFilter] = useState('');
  const [mobileStageTab, setMobileStageTab] = useState<'ALL' | 'WAITING' | 'REFILL' | 'TESTING' | 'DONE'>('ALL');
  const [selectedCartridge, setSelectedCartridge] = useState<Cartridge | null>(null);

  // Modal Technical Edit State
  const [inputWeight, setInputWeight] = useState<string>('');
  const [outputWeight, setOutputWeight] = useState<string>('');
  const [resultClass, setResultClass] = useState<ResultClassification>('PENDENTE');
  const [resultOtherDesc, setResultOtherDesc] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState<CartridgeStatus>('EM_RECARGA');

  const canEditTech = hasPermission('update_tech_status');

  const loadData = () => {
    const carts = AppStore.getCartridges(currentCompany.id);
    const stt = AppStore.getSettings(currentCompany.id);
    setCartridges(carts);
    setSettings(stt);
  };

  useEffect(() => {
    loadData();
  }, [currentCompany.id]);

  if (!currentUser) return null;

  // Open Technician Drawer / Modal
  const handleOpenCartridge = (cart: Cartridge) => {
    setSelectedCartridge(cart);
    setInputWeight(cart.input_weight_grams?.toString() || '');
    setOutputWeight(cart.output_weight_grams?.toString() || '');
    setResultClass(cart.result_classification || 'PENDENTE');
    setResultOtherDesc(cart.result_other_description || '');
    setTechNotes(cart.technical_notes || '');
    setTargetStatus(cart.status);
  };

  // Save Technical Update
  const handleSaveTechUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCartridge || !canEditTech) return;

    AppStore.updateCartridgeTech({
      cartridgeId: selectedCartridge.id,
      technicianId: currentUser.id,
      status: targetStatus,
      resultClassification: resultClass,
      resultOtherDescription: resultOtherDesc,
      inputWeightGrams: inputWeight ? Number(inputWeight) : undefined,
      outputWeightGrams: outputWeight ? Number(outputWeight) : undefined,
      technicalNotes: techNotes
    });

    loadData();
    setSelectedCartridge(null);
  };

  // Quick 1-Click Action: Approve and Complete
  const handleQuickApprove = () => {
    if (!selectedCartridge || !canEditTech) return;
    const finalOutWeight = outputWeight ? Number(outputWeight) : (selectedCartridge.model?.full_weight_grams || 35.0);

    AppStore.updateCartridgeTech({
      cartridgeId: selectedCartridge.id,
      technicianId: currentUser.id,
      status: 'FINALIZADO',
      resultClassification: 'OK',
      inputWeightGrams: inputWeight ? Number(inputWeight) : selectedCartridge.input_weight_grams,
      outputWeightGrams: finalOutWeight,
      technicalNotes: techNotes || 'Recarga e teste elétrico 100% aprovados na bancada.'
    });

    loadData();
    setSelectedCartridge(null);
  };

  // Filtered cartridges
  const filtered = cartridges.filter(c => 
    !searchFilter ||
    c.serial_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.final_serie.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.customer_name && c.customer_name.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (c.model?.model_name && c.model.model_name.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // Group into Kanban Columns
  const colWaiting = filtered.filter(c => ['RECEBIDO', 'AGUARDANDO_VERIFICACAO', 'EM_VERIFICACAO'].includes(c.status));
  const colRefill = filtered.filter(c => ['AGUARDANDO_RECARGA', 'EM_RECARGA'].includes(c.status));
  const colTesting = filtered.filter(c => ['AGUARDANDO_TESTE', 'EM_TESTE'].includes(c.status));
  const colDone = filtered.filter(c => ['FINALIZADO', 'COM_PROBLEMA', 'SEM_REPARO', 'ENTREGUE'].includes(c.status));

  // Calculated Weight Diff Live Preview
  const inVal = Number(inputWeight) || 0;
  const outVal = Number(outputWeight) || 0;
  const liveDiff = (outVal > 0 && inVal > 0) ? (outVal - inVal).toFixed(1) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Bancada Técnica & Fila</span>
            <Badge className="bg-amber-700 text-white font-bold text-[10px]">Oficina</Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de fluxo técnico, pesagem de tinta, testes e diagnósticos
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por cliente, modelo ou série..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Mobile Stage Selector Tabs (Visible on < lg screens) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:hidden">
        <button
          onClick={() => setMobileStageTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
            mobileStageTab === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400'
          }`}
        >
          Todos ({filtered.length})
        </button>
        <button
          onClick={() => setMobileStageTab('WAITING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
            mobileStageTab === 'WAITING'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
          }`}
        >
          Análise ({colWaiting.length})
        </button>
        <button
          onClick={() => setMobileStageTab('REFILL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
            mobileStageTab === 'REFILL'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
          }`}
        >
          Recarga ({colRefill.length})
        </button>
        <button
          onClick={() => setMobileStageTab('TESTING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
            mobileStageTab === 'TESTING'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
          }`}
        >
          Teste ({colTesting.length})
        </button>
        <button
          onClick={() => setMobileStageTab('DONE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
            mobileStageTab === 'DONE'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          }`}
        >
          Prontos ({colDone.length})
        </button>
      </div>

      {/* Notice if Attendant is viewing Bancada */}
      {!canEditTech && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Modo Somente Leitura (Atendente):</strong> Você pode acompanhar o andamento dos cartuchos na bancada, mas alterações técnicas e diagnósticos só podem ser gravados por Técnicos ou Administradores.
          </span>
        </div>
      )}

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {/* Column 1: Aguardando Análise */}
        <div className={`bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 ${
          mobileStageTab !== 'ALL' && mobileStageTab !== 'WAITING' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center justify-between px-1.5 py-0.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Aguardando Análise ({colWaiting.length})</span>
            </h3>
          </div>

          <div className="space-y-2">
            {colWaiting.map(cart => (
              <KanbanCard key={cart.id} cart={cart} onClick={() => handleOpenCartridge(cart)} />
            ))}
            {colWaiting.length === 0 && <EmptyColumn />}
          </div>
        </div>

        {/* Column 2: Em Recarga */}
        <div className={`bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 ${
          mobileStageTab !== 'ALL' && mobileStageTab !== 'REFILL' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center justify-between px-1.5 py-0.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-purple-800 dark:text-purple-400 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              <span>Em Recarga ({colRefill.length})</span>
            </h3>
          </div>

          <div className="space-y-2">
            {colRefill.map(cart => (
              <KanbanCard key={cart.id} cart={cart} onClick={() => handleOpenCartridge(cart)} />
            ))}
            {colRefill.length === 0 && <EmptyColumn />}
          </div>
        </div>

        {/* Column 3: Aguardando Teste */}
        <div className={`bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 ${
          mobileStageTab !== 'ALL' && mobileStageTab !== 'TESTING' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center justify-between px-1.5 py-0.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              <span>Em Teste ({colTesting.length})</span>
            </h3>
          </div>

          <div className="space-y-2">
            {colTesting.map(cart => (
              <KanbanCard key={cart.id} cart={cart} onClick={() => handleOpenCartridge(cart)} />
            ))}
            {colTesting.length === 0 && <EmptyColumn />}
          </div>
        </div>

        {/* Column 4: Finalizados / Defeitos */}
        <div className={`bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 ${
          mobileStageTab !== 'ALL' && mobileStageTab !== 'DONE' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center justify-between px-1.5 py-0.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluídos / Defeitos ({colDone.length})</span>
            </h3>
          </div>

          <div className="space-y-2">
            {colDone.map(cart => (
              <KanbanCard key={cart.id} cart={cart} onClick={() => handleOpenCartridge(cart)} />
            ))}
            {colDone.length === 0 && <EmptyColumn />}
          </div>
        </div>
      </div>

      {/* Technician Action Modal / Drawer */}
      {selectedCartridge && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-bold text-lg">{selectedCartridge.serial_number}</span>
                  <Badge className="bg-amber-500 text-slate-950 font-mono font-bold">
                    Série: {selectedCartridge.final_serie}
                  </Badge>
                </div>
                <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                  <p className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cliente: {selectedCartridge.customer_name || 'Cliente'}</span>
                  </p>
                  <p>
                    Modelo: <strong className="text-white">{selectedCartridge.model?.model_name}</strong> ({selectedCartridge.color}) {selectedCartridge.is_xl ? '[XL]' : ''}
                  </p>
                </div>
              </div>

              <Badge className={getStatusBadgeConfig(selectedCartridge.status).className}>
                {getStatusBadgeConfig(selectedCartridge.status).label}
              </Badge>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveTechUpdate} className="p-6 space-y-4">
              {/* Reference Weight Info from Catalog */}
              {selectedCartridge.model && (
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl text-xs flex items-center justify-between border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500">Capacidade Tinta:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{selectedCartridge.model.capacity_ml ? `${selectedCartridge.model.capacity_ml} ml` : 'N/I'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Peso Vazio Ideal:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{selectedCartridge.model.empty_weight_grams ? `${selectedCartridge.model.empty_weight_grams} g` : 'N/I'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Peso Cheio Ideal:</span>{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">{selectedCartridge.model.full_weight_grams ? `${selectedCartridge.model.full_weight_grams} g` : 'N/I'}</strong>
                  </div>
                </div>
              )}

              {/* Reception notes */}
              {selectedCartridge.reception_notes && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-xs border border-amber-200 dark:border-amber-800/40 text-slate-700 dark:text-slate-300">
                  <strong>Obs. Balcão / Recepção:</strong> {selectedCartridge.reception_notes}
                </div>
              )}

              {/* Weight Section (Input & Output Weight + Auto Calculated Diff) */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  <span>Pesagem na Bancada (Gramagem Injetada)</span>
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Peso Entrada (g)</span>
                      {settings.input_weight_responsibility === 'TECNICO' && (
                        <span className="text-[9px] text-amber-700 font-bold bg-amber-100 dark:bg-amber-950 px-1 rounded">Bancada</span>
                      )}
                      {settings.input_weight_responsibility === 'ATENDENTE' && (
                        <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 dark:bg-emerald-950 px-1 rounded">Balcão</span>
                      )}
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 27.5"
                      value={inputWeight}
                      disabled={!canEditTech || (settings.input_weight_responsibility === 'ATENDENTE' && currentUser.role !== 'ADMINISTRADOR' && Boolean(selectedCartridge.input_weight_grams))}
                      onChange={(e) => setInputWeight(e.target.value)}
                      className={`text-xs ${settings.input_weight_responsibility === 'TECNICO' ? 'border-amber-400 font-bold' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Peso Saída / Cheio (g)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 35.5"
                      value={outputWeight}
                      disabled={!canEditTech}
                      onChange={(e) => setOutputWeight(e.target.value)}
                      className="text-xs font-bold"
                    />
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Tinta Injetada</span>
                    <span className={`text-base font-extrabold ${liveDiff && Number(liveDiff) > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {liveDiff ? `+ ${liveDiff} g` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Result Classification & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Resultado Técnico / Diagnóstico *
                  </label>
                  <Select
                    value={resultClass}
                    disabled={!canEditTech}
                    onChange={(e) => setResultClass(e.target.value as ResultClassification)}
                    className="text-xs font-semibold"
                  >
                    <option value="PENDENTE">⏳ Análise Pendente</option>
                    <option value="OK">✅ 100% OK (Aprovado no Teste)</option>
                    <option value="CID">⚠️ CID (Circuito Impresso Queimado/Danificado)</option>
                    <option value="QUEIMADO">🔥 QUEIMADO (Sem Reconhecimento na Máquina)</option>
                    <option value="FALHA_IMPRESSAO">❌ Falha de Impressão / Cabeça Riscando</option>
                    <option value="ENTUPIDO">💧 Injetor Entupido / Ressecado</option>
                    <option value="SEM_REPARO">🛑 Sem Reparo Possível</option>
                    <option value="OUTRO">❓ Outro Diagnóstico</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Status na Fila *
                  </label>
                  <Select
                    value={targetStatus}
                    disabled={!canEditTech}
                    onChange={(e) => setTargetStatus(e.target.value as CartridgeStatus)}
                    className="text-xs font-semibold"
                  >
                    <option value="EM_VERIFICACAO">EM_VERIFICACAO</option>
                    <option value="EM_RECARGA">EM_RECARGA</option>
                    <option value="EM_TESTE">EM_TESTE</option>
                    <option value="FINALIZADO">FINALIZADO (Pronto p/ Entrega)</option>
                    <option value="COM_PROBLEMA">COM_PROBLEMA</option>
                    <option value="SEM_REPARO">SEM_REPARO</option>
                  </Select>
                </div>
              </div>

              {/* Quick Diagnostic Shortcut Buttons for Technicians */}
              {canEditTech && (
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                    Atalhos Rápidos de Diagnóstico da Bancada:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleQuickApprove}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-8"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Aprovar 100% OK & Finalizar</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResultClass('CID');
                        setTargetStatus('COM_PROBLEMA');
                        setTechNotes('Circuito elétrico CID com falha na leitura da impressora.');
                      }}
                      className="border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-50 text-xs h-8 font-semibold"
                    >
                      Marcar CID
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResultClass('QUEIMADO');
                        setTargetStatus('COM_PROBLEMA');
                        setTechNotes('Resistência térmica do bico queimada.');
                      }}
                      className="border-rose-400 text-rose-700 dark:text-rose-300 hover:bg-rose-50 text-xs h-8 font-semibold"
                    >
                      Marcar QUEIMADO
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResultClass('ENTUPIDO');
                        setTargetStatus('EM_RECARGA');
                        setTechNotes('Necessário banho químico e ultrassom para desobstrução.');
                      }}
                      className="border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-blue-50 text-xs h-8 font-semibold"
                    >
                      Marcar ENTUPIDO
                    </Button>
                  </div>
                </div>
              )}

              {/* Technical Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Laudo Técnico & Procedimento Realizado
                </label>
                <textarea
                  className="w-full h-18 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Descreva o procedimento realizado na bancada (ex: desobstrução por sucção, recarga com 3ml de corante, teste 100% uniforme)..."
                  value={techNotes}
                  disabled={!canEditTech}
                  onChange={(e) => setTechNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCartridge(null)}>
                  Fechar
                </Button>
                {canEditTech && (
                  <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                    Salvar Alterações Técnicas
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanCard({ cart, onClick }: { cart: Cartridge; onClick: () => void }) {
  const statusBadge = getStatusBadgeConfig(cart.status);
  const resultBadge = getResultBadgeConfig(cart.result_classification);

  return (
    <Card 
      onClick={onClick}
      className="p-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer shadow-sm hover:shadow group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 transition-colors">
          {cart.serial_number}
        </span>
        <span className="font-mono text-xs bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-300">
          {cart.final_serie}
        </span>
      </div>

      {/* Customer Name */}
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-slate-200/80 dark:border-slate-700/80">
        <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="truncate font-semibold">{cart.customer_name || 'Cliente'}</span>
      </div>

      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
        {cart.model?.model_name || 'Cartucho'} ({cart.color}) {cart.is_xl ? '[XL]' : ''}
      </div>

      <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1.5">
        <span>{cart.service_requested.replace('_E_', '+')}</span>
        <span>Peso: {formatWeight(cart.input_weight_grams)}</span>
      </div>

      {cart.result_classification !== 'PENDENTE' && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className={`text-[10px] px-2 py-0.5 rounded ${resultBadge.className}`}>
            {resultBadge.label}
          </span>
          {cart.weight_diff_grams && (
            <span className="text-[11px] font-bold text-emerald-600">
              +{cart.weight_diff_grams}g
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

function EmptyColumn() {
  return (
    <div className="p-6 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
      Nenhum cartucho nesta etapa.
    </div>
  );
}

