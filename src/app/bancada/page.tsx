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
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Filter,
  ShieldAlert,
  Info,
  Droplets,
  AlertOctagon,
  CheckCircle,
  ThumbsUp,
  Sliders,
  Settings2,
  PlusCircle,
  Trash2,
  X,
  RotateCcw,
  Check,
  Layers,
  Zap
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { Cartridge, CartridgeStatus, ResultClassification, CompanySettings, SegmentCustomization, KanbanColumnConfig, KanbanColumnColor } from '@/types';
import { formatCurrency, formatWeight, getStatusBadgeConfig, getResultBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const ALL_STATUSES: { key: CartridgeStatus; label: string }[] = [
  { key: 'RECEBIDO', label: 'Recebido (Balcão)' },
  { key: 'AGUARDANDO_VERIFICACAO', label: 'Aguardando Verificação' },
  { key: 'EM_VERIFICACAO', label: 'Em Verificação' },
  { key: 'AGUARDANDO_RECARGA', label: 'Aguardando Recarga/Manutenção' },
  { key: 'EM_RECARGA', label: 'Em Recarga/Manutenção' },
  { key: 'AGUARDANDO_TESTE', label: 'Aguardando Teste' },
  { key: 'EM_TESTE', label: 'Em Teste' },
  { key: 'FINALIZADO', label: 'Finalizado (Pronto)' },
  { key: 'ENTREGUE', label: 'Entregue ao Cliente' },
  { key: 'COM_PROBLEMA', label: 'Aguardando Peça / Atenção' },
  { key: 'SEM_REPARO', label: 'Sem Reparo (Inviável)' }
];

const COLOR_MAP: Record<KanbanColumnColor, { bg: string; border: string; text: string; headerBg: string; badge: string }> = {
  amber: {
    bg: 'bg-amber-50/40 dark:bg-[#13171f]',
    border: 'border-amber-200/80 dark:border-amber-900/50',
    text: 'text-amber-800 dark:text-amber-300',
    headerBg: 'bg-amber-100/70 dark:bg-amber-950/50',
    badge: 'bg-amber-600 text-white'
  },
  purple: {
    bg: 'bg-purple-50/40 dark:bg-[#131522]',
    border: 'border-purple-200/80 dark:border-purple-900/50',
    text: 'text-purple-800 dark:text-purple-300',
    headerBg: 'bg-purple-100/70 dark:bg-purple-950/50',
    badge: 'bg-purple-600 text-white'
  },
  blue: {
    bg: 'bg-blue-50/40 dark:bg-[#0f1826]',
    border: 'border-blue-200/80 dark:border-blue-900/50',
    text: 'text-blue-800 dark:text-blue-300',
    headerBg: 'bg-blue-100/70 dark:bg-blue-950/50',
    badge: 'bg-blue-600 text-white'
  },
  emerald: {
    bg: 'bg-emerald-50/40 dark:bg-[#0d1c1a]',
    border: 'border-emerald-200/80 dark:border-emerald-900/50',
    text: 'text-emerald-800 dark:text-emerald-300',
    headerBg: 'bg-emerald-100/70 dark:bg-emerald-950/50',
    badge: 'bg-emerald-600 text-white'
  },
  rose: {
    bg: 'bg-rose-50/40 dark:bg-[#1c1216]',
    border: 'border-rose-200/80 dark:border-rose-900/50',
    text: 'text-rose-800 dark:text-rose-300',
    headerBg: 'bg-rose-100/70 dark:bg-rose-950/50',
    badge: 'bg-rose-600 text-white'
  },
  indigo: {
    bg: 'bg-indigo-50/40 dark:bg-[#121626]',
    border: 'border-indigo-200/80 dark:border-indigo-900/50',
    text: 'text-indigo-800 dark:text-indigo-300',
    headerBg: 'bg-indigo-100/70 dark:bg-indigo-950/50',
    badge: 'bg-indigo-600 text-white'
  },
  teal: {
    bg: 'bg-teal-50/40 dark:bg-[#0e1c1e]',
    border: 'border-teal-200/80 dark:border-teal-900/50',
    text: 'text-teal-800 dark:text-teal-300',
    headerBg: 'bg-teal-100/70 dark:bg-teal-950/50',
    badge: 'bg-teal-600 text-white'
  },
  slate: {
    bg: 'bg-slate-100/50 dark:bg-[#0f1420]',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-slate-800 dark:text-slate-300',
    headerBg: 'bg-slate-200/60 dark:bg-slate-800',
    badge: 'bg-slate-700 text-white'
  }
};

export default function TechnicianWorkbenchPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumnConfig[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));
  const [segmentConfig, setSegmentConfig] = useState<SegmentCustomization>(AppStore.getSegmentConfig(currentCompany.id));
  const [searchFilter, setSearchFilter] = useState('');
  const [activeMobileColumnId, setActiveMobileColumnId] = useState<string>('ALL');
  const [selectedCartridge, setSelectedCartridge] = useState<Cartridge | null>(null);

  // Kanban Customization Modal State
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [editedColumns, setEditedColumns] = useState<KanbanColumnConfig[]>([]);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Modal Technical Edit State
  const [inputWeight, setInputWeight] = useState<string>('');
  const [outputWeight, setOutputWeight] = useState<string>('');
  const [resultClass, setResultClass] = useState<ResultClassification>('PENDENTE');
  const [resultOtherDesc, setResultOtherDesc] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState<CartridgeStatus>('EM_RECARGA');
  const [checklistState, setChecklistState] = useState<Array<{ item: string; checked: boolean; notes?: string }>>([]);

  const canEditTech = hasPermission('update_tech_status');
  const canCustomizeKanban = hasPermission('customize_kanban') || hasPermission('manage_company') || currentUser?.role === 'ADMINISTRADOR';

  const loadData = () => {
    const carts = AppStore.getCartridges(currentCompany.id);
    const cols = AppStore.getKanbanColumns(currentCompany.id);
    const stt = AppStore.getSettings(currentCompany.id);
    const seg = AppStore.getSegmentConfig(currentCompany.id);
    setCartridges(carts);
    setKanbanColumns(cols);
    setSettings(stt);
    setSegmentConfig(seg);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  if (!hasPermission('technical_workbench') || currentUser.role === 'ATENDENTE') {
    return (
      <div className="p-8 text-center space-y-4 max-w-lg mx-auto mt-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Acesso Restrito à Oficina Técnica</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          O perfil de <strong>Atendente</strong> não possui permissão para acessar a Bancada Técnica e o quadro Kanban. Utilize as funções de Balcão e Recepção.
        </p>
      </div>
    );
  }

  // Open Technician Drawer / Modal
  const handleOpenCartridge = (cart: Cartridge) => {
    setSelectedCartridge(cart);
    setInputWeight(cart.input_weight_grams?.toString() || '');
    setOutputWeight(cart.output_weight_grams?.toString() || '');
    setResultClass(cart.result_classification || 'PENDENTE');
    setResultOtherDesc(cart.result_other_description || '');
    setTechNotes(cart.technical_notes || '');
    setTargetStatus(cart.status);
    setChecklistState(
      cart.checklist || 
      (settings.custom_checklist_items || segmentConfig.defaultChecklistItems || []).map(item => ({ item, checked: false }))
    );
  };

  const handleToggleTechChecklist = (idx: number) => {
    setChecklistState(prev => prev.map((c, i) => i === idx ? { ...c, checked: !c.checked } : c));
  };

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
      technicalNotes: techNotes,
      checklist: checklistState
    });

    loadData();
    setSelectedCartridge(null);
  };

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
      technicalNotes: techNotes || `Diagnóstico e serviço de ${segmentConfig.itemLabelSingular.toLowerCase()} 100% aprovados e finalizados na bancada.`,
      checklist: checklistState.map(c => ({ ...c, checked: true }))
    });

    loadData();
    setSelectedCartridge(null);
  };

  const handleQuickMove = (cart: Cartridge, direction: -1 | 1) => {
    if (!canEditTech) return;

    const currentColIdx = kanbanColumns.findIndex(col => col.statuses.includes(cart.status));
    if (currentColIdx === -1) return;

    const targetColIdx = currentColIdx + direction;
    if (targetColIdx < 0 || targetColIdx >= kanbanColumns.length) return;

    const targetCol = kanbanColumns[targetColIdx];
    const targetStatus = targetCol.statuses[0] || 'EM_RECARGA';

    AppStore.moveCartridgeStatus(cart.id, targetStatus, currentUser.full_name, `Avançado via botão rápido para ${targetCol.title}`);
    loadData();
  };

  const handleDropOnColumn = (targetCol: KanbanColumnConfig, cartId: string) => {
    if (!canEditTech || !cartId) return;
    setDragOverColId(null);
    const targetStatus = targetCol.statuses[0] || 'EM_RECARGA';
    AppStore.moveCartridgeStatus(cartId, targetStatus, currentUser.full_name, `Movido via arrastar e soltar para ${targetCol.title}`);
    loadData();
  };

  const handleOpenCustomize = () => {
    setEditedColumns(JSON.parse(JSON.stringify(kanbanColumns)));
    setShowCustomizeModal(true);
  };

  const handleSaveCustomization = () => {
    AppStore.saveKanbanColumns(currentCompany.id, editedColumns, currentUser.full_name);
    loadData();
    setShowCustomizeModal(false);
  };

  const handleResetToPreset = () => {
    const presetCols = AppStore.getKanbanColumns();
    setEditedColumns(presetCols);
  };

  const filtered = cartridges.filter(c => 
    !searchFilter ||
    c.serial_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.final_serie.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.customer_name && c.customer_name.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (c.model?.model_name && c.model.model_name.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const inVal = Number(inputWeight) || 0;
  const outVal = Number(outputWeight) || 0;
  const liveDiff = (outVal > 0 && inVal > 0) ? (outVal - inVal).toFixed(1) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0e1626] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500 shrink-0" />
              <span>Bancada Técnica & Fila Kanban</span>
            </h1>
            <Badge className="bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
              {segmentConfig.segmentName}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Arraste os cartões entre as etapas ou utilize os botões de avanço rápido de bancada
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Buscar cliente, modelo ou ${segmentConfig.identifierLabel.toLowerCase()}...`}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {canCustomizeKanban && (
            <Button
              onClick={handleOpenCustomize}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold h-9 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings2 className="w-4 h-4 text-amber-500" />
              <span>Personalizar Etapas</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Stage Selector Tabs (Visible on < lg screens) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:hidden">
        <button
          onClick={() => setActiveMobileColumnId('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeMobileColumnId === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400'
          }`}
        >
          Todos ({filtered.length})
        </button>
        {kanbanColumns.map(col => {
          const count = filtered.filter(c => col.statuses.includes(c.status)).length;
          const styles = COLOR_MAP[col.color] || COLOR_MAP.amber;
          const isActive = activeMobileColumnId === col.id;

          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileColumnId(col.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? `${styles.badge} shadow-xs`
                  : `${styles.bg} ${styles.text}`
              }`}
            >
              {col.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Dynamic Kanban Board Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(kanbanColumns.length, 5)} gap-4 items-start`}>
        {kanbanColumns.map((col, colIdx) => {
          const colItems = filtered.filter(c => col.statuses.includes(c.status));
          const styles = COLOR_MAP[col.color] || COLOR_MAP.amber;
          const isMobileVisible = activeMobileColumnId === 'ALL' || activeMobileColumnId === col.id;
          const isDragOver = dragOverColId === col.id;

          return (
            <div 
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColId(col.id);
              }}
              onDragLeave={() => setDragOverColId(null)}
              onDrop={(e) => {
                e.preventDefault();
                const cartId = e.dataTransfer.getData('text/plain');
                handleDropOnColumn(col, cartId);
              }}
              className={`p-3.5 rounded-2xl border transition-all space-y-3 ${styles.bg} ${styles.border} ${
                isDragOver ? 'ring-2 ring-emerald-500 border-emerald-500 scale-[1.01]' : ''
              } ${isMobileVisible ? 'block' : 'hidden lg:block'}`}
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${styles.headerBg}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`font-black text-xs uppercase tracking-wider truncate ${styles.text}`}>
                    {col.title}
                  </span>
                </div>
                <Badge className={`${styles.badge} text-[10px] font-mono px-2 py-0.2 rounded-full font-bold shadow-xs`}>
                  {colItems.length}
                </Badge>
              </div>

              {col.description && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 px-1 leading-tight font-medium">
                  {col.description}
                </p>
              )}

              {/* Cards List */}
              <div className="space-y-2.5 min-h-[140px]">
                {colItems.map(cart => (
                  <KanbanCard 
                    key={cart.id} 
                    cart={cart} 
                    segmentConfig={segmentConfig}
                    canEdit={canEditTech}
                    isFirstCol={colIdx === 0}
                    isLastCol={colIdx === kanbanColumns.length - 1}
                    onQuickMoveBack={() => handleQuickMove(cart, -1)}
                    onQuickMoveForward={() => handleQuickMove(cart, 1)}
                    onClick={() => handleOpenCartridge(cart)} 
                  />
                ))}
                {colItems.length === 0 && <EmptyColumn />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Customize Kanban Columns */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span>Personalizar Colunas & Etapas do Kanban</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Renomeie colunas, selecione cores e configure quais status pertencem a cada etapa
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowCustomizeModal(false)} className="h-8 w-8 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {editedColumns.map((col, idx) => (
                <div 
                  key={col.id || idx}
                  className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                        Título da Coluna #{idx + 1}
                      </label>
                      <Input
                        value={col.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditedColumns(prev => prev.map((c, i) => i === idx ? { ...c, title: val } : c));
                        }}
                        className="text-xs font-bold h-9 rounded-xl"
                      />
                    </div>

                    <div className="w-36">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                        Cor de Destaque
                      </label>
                      <Select
                        value={col.color}
                        onChange={(e) => {
                          const val = e.target.value as KanbanColumnColor;
                          setEditedColumns(prev => prev.map((c, i) => i === idx ? { ...c, color: val } : c));
                        }}
                        className="text-xs font-semibold h-9 rounded-xl"
                      >
                        <option value="amber">Âmbar / Amarelo</option>
                        <option value="purple">Roxo / Púrpura</option>
                        <option value="blue">Azul</option>
                        <option value="emerald">Verde Esmeralda</option>
                        <option value="teal">Verde Azulado</option>
                        <option value="indigo">Índigo</option>
                        <option value="rose">Rosa / Vermelho</option>
                        <option value="slate">Cinza Neutro</option>
                      </Select>
                    </div>

                    {editedColumns.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setEditedColumns(prev => prev.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1.5 mt-5"
                        title="Remover coluna"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                      Status vinculados a esta coluna:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_STATUSES.map(st => {
                        const isChecked = col.statuses.includes(st.key);
                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => {
                              setEditedColumns(prev => prev.map((c, i) => {
                                if (i !== idx) return c;
                                const newStatuses = isChecked
                                  ? c.statuses.filter(s => s !== st.key)
                                  : [...c.statuses, st.key];
                                return { ...c, statuses: newStatuses };
                              }));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                              isChecked
                                ? 'bg-slate-900 text-white dark:bg-emerald-600 border-transparent shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                            }`}
                          >
                            {isChecked ? '✓ ' : '+ '}{st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newId = `col-${Date.now()}`;
                    setEditedColumns(prev => [
                      ...prev,
                      { id: newId, title: `Nova Etapa ${prev.length + 1}`, color: 'teal', statuses: ['EM_TESTE'] }
                    ]);
                  }}
                  className="gap-1.5 text-xs font-semibold rounded-xl"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Adicionar Coluna</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToPreset}
                  className="gap-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrão</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCustomizeModal(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={handleSaveCustomization} className="bg-amber-600 hover:bg-amber-700 font-bold text-white rounded-xl">
                Salvar Configuração
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Technician Action Modal / Drawer */}
      {selectedCartridge && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-black text-lg">{selectedCartridge.serial_number}</span>
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
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs flex items-center justify-between border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500">Capacidade:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{selectedCartridge.model.capacity_ml ? `${selectedCartridge.model.capacity_ml} ml` : 'N/I'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Peso Vazio:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{selectedCartridge.model.empty_weight_grams ? `${selectedCartridge.model.empty_weight_grams} g` : 'N/I'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Peso Cheio:</span>{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">{selectedCartridge.model.full_weight_grams ? `${selectedCartridge.model.full_weight_grams} g` : 'N/I'}</strong>
                  </div>
                </div>
              )}

              {/* Weight Section */}
              {segmentConfig.hasWeightInspection && (
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    <span>Pesagem na Bancada & Delta Injetado</span>
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Peso Entrada (g)</span>
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 27.5"
                        value={inputWeight}
                        disabled={!canEditTech}
                        onChange={(e) => setInputWeight(e.target.value)}
                        className="text-xs font-bold h-9 rounded-xl"
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
                        className="text-xs font-bold h-9 rounded-xl"
                      />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center text-center shadow-xs">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Tinta Injetada</span>
                      <span className={`text-base font-black ${liveDiff && Number(liveDiff) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700'}`}>
                        {liveDiff ? `+ ${liveDiff} g` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

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
                    className="text-xs font-semibold h-9 rounded-xl"
                  >
                    <option value="PENDENTE">⏳ Análise Pendente</option>
                    <option value="OK">✅ 100% OK (Aprovado / Reparado)</option>
                    <option value="CID">⚠️ CID / Falha Eletrônica</option>
                    <option value="QUEIMADO">🔥 QUEIMADO / Curto-Circuito</option>
                    <option value="FALHA_IMPRESSAO">❌ Avaria Mecânica / Peça Danificada</option>
                    <option value="ENTUPIDO">💧 Obstruído / Ressecado</option>
                    <option value="SEM_REPARO">🛑 Sem Reparo Possível / Condenado</option>
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
                    className="text-xs font-semibold h-9 rounded-xl"
                  >
                    <option value="EM_VERIFICACAO">EM_VERIFICACAO (Diagnóstico / Triagem)</option>
                    <option value="EM_RECARGA">EM_RECARGA (Em Manutenção / Reparo)</option>
                    <option value="EM_TESTE">EM_TESTE (Validação & Teste Final)</option>
                    <option value="FINALIZADO">FINALIZADO (Pronto p/ Entrega)</option>
                    <option value="COM_PROBLEMA">COM_PROBLEMA (Aguardando Aprovação / Peça)</option>
                    <option value="SEM_REPARO">SEM_REPARO (Desistência / Sem Solução)</option>
                  </Select>
                </div>
              </div>

              {/* Quick Diagnostic Shortcut Buttons */}
              {canEditTech && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                    Atalhos Rápidos de Diagnóstico da Bancada:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleQuickApprove}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-8 rounded-xl shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Aprovar 100% OK & Finalizar</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResultClass('SEM_REPARO');
                        setTargetStatus('SEM_REPARO');
                        setTechNotes('Inviabilidade técnica de conserto constatada na bancada.');
                      }}
                      className="border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50 text-xs h-8 font-semibold rounded-xl"
                    >
                      Marcar SEM REPARO
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResultClass('OUTRO');
                        setTargetStatus('COM_PROBLEMA');
                        setTechNotes('Aguardando chegada de componente / autorização do cliente.');
                      }}
                      className="border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-50 text-xs h-8 font-semibold rounded-xl"
                    >
                      Aguardando Peça
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
                  className="w-full h-18 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 font-medium"
                  placeholder="Descreva o procedimento realizado na bancada..."
                  value={techNotes}
                  disabled={!canEditTech}
                  onChange={(e) => setTechNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCartridge(null)} className="rounded-xl">
                  Fechar
                </Button>
                {canEditTech && (
                  <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs">
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

function KanbanCard({ 
  cart, 
  segmentConfig,
  canEdit,
  isFirstCol,
  isLastCol,
  onQuickMoveBack,
  onQuickMoveForward,
  onClick 
}: { 
  cart: Cartridge; 
  segmentConfig: SegmentCustomization;
  canEdit: boolean;
  isFirstCol?: boolean;
  isLastCol?: boolean;
  onQuickMoveBack: () => void;
  onQuickMoveForward: () => void;
  onClick: () => void; 
}) {
  const statusBadge = getStatusBadgeConfig(cart.status);
  const resultBadge = getResultBadgeConfig(cart.result_classification);

  return (
    <div 
      onClick={onClick}
      draggable={canEdit}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', cart.id);
      }}
      className={`p-3.5 bg-white dark:bg-[#111927] border border-slate-200/80 dark:border-slate-800 rounded-2xl hover:border-amber-400/80 dark:hover:border-amber-500/80 transition-all cursor-pointer shadow-xs hover:shadow-md group ${
        canEdit ? 'active:cursor-grabbing hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
          {cart.serial_number}
        </span>
        <span className="font-mono text-xs bg-amber-100/80 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-lg font-black border border-amber-300/80 dark:border-amber-800">
          {cart.final_serie || 'S/N'}
        </span>
      </div>

      {/* Customer Name */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
        <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="truncate">{cart.customer_name || 'Cliente'}</span>
      </div>

      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
        {cart.model?.model_name || segmentConfig.itemLabelSingular} {cart.color ? `(${cart.color})` : ''} {cart.is_xl ? '[XL]' : ''}
      </div>

      <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1.5">
        <span className="truncate max-w-[130px] font-medium">{cart.service_requested.replace(/_/g, ' ')}</span>
        {segmentConfig.hasWeightInspection && cart.input_weight_grams ? (
          <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">{formatWeight(cart.input_weight_grams)}</span>
        ) : (
          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        )}
      </div>

      {/* Result badge or weight diff */}
      {cart.result_classification !== 'PENDENTE' && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${resultBadge.className}`}>
            {resultBadge.label}
          </span>
          {cart.weight_diff_grams ? (
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 font-mono">
              +{cart.weight_diff_grams}g
            </span>
          ) : null}
        </div>
      )}

      {/* Quick 1-Click Move Toolbar */}
      {canEdit && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
          <button
            type="button"
            disabled={isFirstCol}
            onClick={(e) => {
              e.stopPropagation();
              onQuickMoveBack();
            }}
            title="Voltar para etapa anterior"
            className={`p-1 px-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              isFirstCol
                ? 'opacity-20 cursor-not-allowed text-slate-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold'
            }`}
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="text-[10px]">Voltar</span>
          </button>

          <span className="text-[9px] text-slate-400 font-mono">Arrastar ⇄</span>

          <button
            type="button"
            disabled={isLastCol}
            onClick={(e) => {
              e.stopPropagation();
              onQuickMoveForward();
            }}
            title="Avançar para próxima etapa"
            className={`p-1 px-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              isLastCol
                ? 'opacity-20 cursor-not-allowed text-slate-400'
                : 'bg-amber-100/80 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 font-black'
            }`}
          >
            <span className="text-[10px]">Avançar</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyColumn() {
  return (
    <div className="p-6 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl font-medium">
      Nenhum item nesta etapa.
    </div>
  );
}
