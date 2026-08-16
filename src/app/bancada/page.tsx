'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  Clock, 
  User, 
  FileText, 
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Droplets,
  Check,
  Tag,
  Layers,
  X,
  Laptop,
  Smartphone,
  Printer
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { 
  ServiceOrderItem, 
  WorkflowState, 
  CompanySettings, 
  KanbanColumnColor
} from '@/types';
import { formatCurrency, formatWeight, getStatusBadgeConfig, getResultBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const COLOR_MAP: Record<KanbanColumnColor, { bg: string; border: string; text: string; headerBg: string; badge: string }> = {
  amber: {
    bg: 'bg-slate-50/70 dark:bg-[#0e1626]/70',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-amber-800 dark:text-amber-300',
    headerBg: 'bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/40',
    badge: 'bg-amber-600 text-white'
  },
  purple: {
    bg: 'bg-slate-50/70 dark:bg-[#0e1626]/70',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-purple-800 dark:text-purple-300',
    headerBg: 'bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200/60 dark:border-purple-900/40',
    badge: 'bg-purple-600 text-white'
  },
  blue: {
    bg: 'bg-slate-50/70 dark:bg-[#0e1626]/70',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-blue-800 dark:text-blue-300',
    headerBg: 'bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200/60 dark:border-blue-900/40',
    badge: 'bg-blue-600 text-white'
  },
  emerald: {
    bg: 'bg-slate-50/70 dark:bg-[#0e1626]/70',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-emerald-800 dark:text-emerald-300',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200/60 dark:border-emerald-900/40',
    badge: 'bg-emerald-600 text-white'
  },
  rose: {
    bg: 'bg-slate-50/70 dark:bg-[#0e1626]/70',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-rose-800 dark:text-rose-300',
    headerBg: 'bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-900/40',
    badge: 'bg-rose-600 text-white'
  },
  indigo: {
    bg: 'bg-slate-50/70 dark:bg-[#0e1626]/70',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-indigo-800 dark:text-indigo-300',
    headerBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200/60 dark:border-indigo-900/40',
    badge: 'bg-indigo-600 text-white'
  },
  teal: {
    bg: 'bg-slate-50/70 dark:bg-[#0e1626]/70',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-teal-800 dark:text-teal-300',
    headerBg: 'bg-teal-50 dark:bg-teal-950/40 border-b border-teal-200/60 dark:border-teal-900/40',
    badge: 'bg-teal-600 text-white'
  },
  slate: {
    bg: 'bg-slate-50/70 dark:bg-[#0e1626]/70',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-slate-800 dark:text-slate-300',
    headerBg: 'bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-700 text-white'
  }
};

export default function TechnicianWorkbenchPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [items, setItems] = useState<ServiceOrderItem[]>([]);
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<ServiceOrderItem | null>(null);

  // Technical Edit Modal State
  const [inputWeight, setInputWeight] = useState<string>('');
  const [outputWeight, setOutputWeight] = useState<string>('');
  const [resultCode, setResultCode] = useState<string>('OK');
  const [resultDesc, setResultDesc] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState<string>('EM_RECARGA');
  const [checklistState, setChecklistState] = useState<Array<{ item: string; checked: boolean }>>([]);

  const canEditTech = hasPermission('update_tech_status') || hasPermission('technical_update') || currentUser?.role === 'ADMINISTRADOR';

  const loadData = () => {
    const allItems = AppStore.getCartridges(currentCompany.id);
    const states = AppStore.getWorkflowStates(currentCompany.id);
    const stt = AppStore.getSettings(currentCompany.id);

    setItems(allItems);
    setWorkflowStates(states);
    setSettings(stt);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  if (!hasPermission('technical_workbench') && currentUser.role === 'ATENDENTE') {
    return (
      <div className="p-8 text-center space-y-4 max-w-lg mx-auto mt-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Acesso Restrito à Oficina Técnica</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          O perfil de <strong>Atendente</strong> não possui permissão para gerenciar a bancada técnica. Utilize as funções de Balcão e Recepção.
        </p>
      </div>
    );
  }

  // Open Technical Execution Modal
  const handleOpenItem = (item: ServiceOrderItem) => {
    setSelectedItem(item);
    const inWeight = item.custom_field_values?.input_weight_grams !== undefined 
      ? item.custom_field_values.input_weight_grams.toString() 
      : '';
    const outWeight = item.custom_field_values?.output_weight_grams !== undefined 
      ? item.custom_field_values.output_weight_grams.toString() 
      : '';

    setInputWeight(inWeight);
    setOutputWeight(outWeight);
    setResultCode(item.result_code || 'OK');
    setResultDesc(item.result_description || '');
    setTechNotes(item.technical_notes || '');
    setTargetStatus(item.status);
    setChecklistState(item.checklist || []);
  };

  const handleToggleChecklist = (idx: number) => {
    setChecklistState(prev => prev.map((c, i) => i === idx ? { ...c, checked: !c.checked } : c));
  };

  const handleSaveTechUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !canEditTech) return;

    const inNum = inputWeight ? parseFloat(inputWeight) : undefined;
    const outNum = outputWeight ? parseFloat(outputWeight) : undefined;

    AppStore.updateOrderItemStatus(selectedItem.id, {
      status: targetStatus,
      result_code: resultCode,
      result_description: resultDesc,
      technical_notes: techNotes,
      assigned_technician_id: currentUser.id,
      custom_field_values: {
        ...(selectedItem.custom_field_values || {}),
        input_weight_grams: inNum,
        output_weight_grams: outNum
      },
      checklist: checklistState
    }, currentUser.full_name);

    setSelectedItem(null);
  };

  const handleQuickApprove = () => {
    if (!selectedItem || !canEditTech) return;
    const outNum = outputWeight ? parseFloat(outputWeight) : undefined;

    AppStore.updateOrderItemStatus(selectedItem.id, {
      status: 'FINALIZADO',
      result_code: 'OK',
      technical_notes: techNotes || 'Testado, aprovado e finalizado na bancada técnica.',
      assigned_technician_id: currentUser.id,
      custom_field_values: {
        ...(selectedItem.custom_field_values || {}),
        output_weight_grams: outNum
      },
      checklist: checklistState.map(c => ({ ...c, checked: true }))
    }, currentUser.full_name);

    setSelectedItem(null);
  };

  // Filter items based on search
  const filteredItems = items.filter(it => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase().trim();
    const modelName = it.model?.name || '';
    const serial = it.internal_identifier || '';
    const cust = it.customer_name || '';
    const osNum = it.order_number || '';
    return modelName.toLowerCase().includes(query) ||
      serial.toLowerCase().includes(query) ||
      cust.toLowerCase().includes(query) ||
      osNum.toLowerCase().includes(query);
  });

  const getItemsForState = (statusCode: string) => {
    return filteredItems.filter(it => it.status === statusCode);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Wrench className="w-5 h-5" />
            </span>
            Bancada Técnica & Oficina (Kanban)
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fila operacional em tempo real, diagnósticos, pesagem e aprovação técnica.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por OS, serial ou cliente..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {workflowStates.map(state => {
          const colItems = getItemsForState(state.code);
          const colorStyles = COLOR_MAP[state.color] || COLOR_MAP.slate;

          return (
            <div
              key={state.code}
              className={`w-80 shrink-0 rounded-2xl border ${colorStyles.border} ${colorStyles.bg} flex flex-col max-h-[calc(100vh-220px)] shadow-sm`}
            >
              {/* Column Header */}
              <div className={`p-3.5 ${colorStyles.headerBg} rounded-t-2xl flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${colorStyles.badge}`} />
                  <span className={`text-xs font-bold ${colorStyles.text}`}>
                    {state.name}
                  </span>
                </div>
                <Badge className={`${colorStyles.badge} text-[10px] font-bold px-2`}>
                  {colItems.length}
                </Badge>
              </div>

              {/* Column Item Cards List */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
                {colItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Nenhum item nesta etapa
                  </div>
                ) : (
                  colItems.map(item => {
                    const inWeight = item.custom_field_values?.input_weight_grams;
                    const outWeight = item.custom_field_values?.output_weight_grams;
                    const inkDiff = outWeight !== undefined && inWeight !== undefined ? (outWeight - inWeight) : undefined;

                    return (
                      <Card
                        key={item.id}
                        onClick={() => handleOpenItem(item)}
                        className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer select-none group"
                      >
                        <CardContent className="p-3.5 space-y-2.5 text-xs">
                          {/* Top Row: OS Number & Identifier */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/40">
                              OS {item.order_number}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {item.internal_identifier}
                            </span>
                          </div>

                          {/* Model & Customer Name */}
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {item.model?.name || 'Modelo'}
                            </h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3" />
                              <span className="truncate">{item.customer_name || 'Cliente'}</span>
                            </p>
                          </div>

                          {/* Reported Issue / Services */}
                          {item.reported_issue && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-lg line-clamp-2">
                              {item.reported_issue}
                            </p>
                          )}

                          {/* Weight scale info if available */}
                          {inWeight !== undefined && (
                            <div className="flex items-center justify-between text-[10px] text-slate-500 bg-amber-50/60 dark:bg-amber-950/30 p-1.5 rounded-md border border-amber-200/40">
                              <span>Entrada: {formatWeight(inWeight)}</span>
                              {outWeight !== undefined && (
                                <span className="font-bold text-emerald-600">
                                  Saída: {formatWeight(outWeight)} {inkDiff !== undefined && `(+${inkDiff.toFixed(1)}g)`}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Footer: Result Badge */}
                          {item.result_code && item.result_code !== 'PENDENTE' && (
                            <div className="pt-1 flex justify-end">
                              <Badge className="text-[9px] font-bold bg-slate-800 text-white">
                                {item.result_code}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Technical Execution Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                    OS {selectedItem.order_number}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {selectedItem.model?.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cliente: <strong className="text-slate-800 dark:text-slate-200">{selectedItem.customer_name}</strong> | Identificador: <strong className="font-mono">{selectedItem.internal_identifier}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTechUpdate} className="space-y-4">
              {/* Balance Scale Weights if Refill or available */}
              <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>Conferência de Balança & Pesagem (gramas)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Peso de Entrada (g):</span>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 28.5"
                      value={inputWeight}
                      onChange={e => setInputWeight(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900 text-right font-bold"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Peso de Saída / Cheio (g):</span>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 36.5"
                      value={outputWeight}
                      onChange={e => setOutputWeight(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900 text-right font-bold text-emerald-600"
                    />
                  </div>
                </div>

                {inputWeight && outputWeight && (
                  <div className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Tinta / Líquido Injetado: {(parseFloat(outputWeight) - parseFloat(inputWeight)).toFixed(1)} g
                  </div>
                )}
              </div>

              {/* Checklist Items if applicable */}
              {checklistState.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Checklist de Inspeção e Testes
                  </label>
                  <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    {checklistState.map((chk, cIdx) => (
                      <label key={cIdx} className="flex items-center gap-2 text-xs cursor-pointer select-none text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={chk.checked}
                          onChange={() => handleToggleChecklist(cIdx)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{chk.item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Opinion / Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Parecer Técnico / Observações da Bancada
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Realizado desentupimento químico nos injetores pretos..."
                  value={techNotes}
                  onChange={e => setTechNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Target State & Technical Result */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Etapa / Status no Fluxo:
                  </label>
                  <Select
                    value={targetStatus}
                    onChange={e => setTargetStatus(e.target.value)}
                    className="h-9 text-xs rounded-xl font-bold"
                  >
                    {workflowStates.map(st => (
                      <option key={st.code} value={st.code}>
                        {st.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Resultado Técnico:
                  </label>
                  <Select
                    value={resultCode}
                    onChange={e => setResultCode(e.target.value)}
                    className="h-9 text-xs rounded-xl font-bold"
                  >
                    <option value="OK">100% OK / Aprovado</option>
                    <option value="CID">CID (Circuito Queimado)</option>
                    <option value="QUEIMADO">Cabeça Queimada</option>
                    <option value="ENTUPIDO">Injetor Entupido</option>
                    <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                    <option value="SEM_REPARO">Sem Reparo (Inviável)</option>
                    <option value="RECUSADO">Orçamento Recusado</option>
                  </Select>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={handleQuickApprove}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aprovar & Finalizar (Pronto p/ Entrega)</span>
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedItem(null)}
                    className="rounded-xl text-xs h-9"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs h-9"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
