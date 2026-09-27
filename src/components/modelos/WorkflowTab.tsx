'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Kanban, 
  Check, 
  X 
} from 'lucide-react';
import { WorkflowState, KanbanColumnColor, StageType, Company, Profile } from '@/types';
import { AppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface WorkflowTabProps {
  workflowStates: WorkflowState[];
  currentCompany: Company;
  currentUser: Profile | null;
  canManage: boolean;
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  showAlert: (title: string, message: string, subtitle?: string, type?: 'warning' | 'info' | 'danger') => void;
  showConfirm: (opts: {
    title: string;
    subtitle?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export function WorkflowTab({
  workflowStates,
  currentCompany,
  currentUser,
  canManage,
  onRefresh,
  showToast,
  showAlert,
  showConfirm,
  isCreateOpen = false,
  onCloseCreate
}: WorkflowTabProps) {
  const [showStateModal, setShowStateModal] = useState(false);
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [stateName, setStateName] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [stateColor, setStateColor] = useState<KanbanColumnColor>('blue');
  const [stateStageType, setStateStageType] = useState<StageType>('EM_ANDAMENTO');
  const [stateIsInitial, setStateIsInitial] = useState(false);
  const [stateIsFinal, setStateIsFinal] = useState(false);

  const handleCloseModal = () => {
    setShowStateModal(false);
    if (onCloseCreate) onCloseCreate();
  };

  const handleOpenAddState = () => {
    setEditingStateId(null);
    setStateName('');
    setStateCode('');
    setStateColor('blue');
    setStateStageType('EM_ANDAMENTO');
    setStateIsInitial(false);
    setStateIsFinal(false);
    setShowStateModal(true);
  };

  useEffect(() => {
    if (isCreateOpen) {
      handleOpenAddState();
    }
  }, [isCreateOpen]);

  const handleOpenEditState = (st: WorkflowState) => {
    setEditingStateId(st.id);
    setStateName(st.name);
    setStateCode(st.code);
    setStateColor(st.color || 'blue');
    setStateStageType(st.stage_type || 'EM_ANDAMENTO');
    setStateIsInitial(Boolean(st.is_initial));
    setStateIsFinal(Boolean(st.is_final));
    setShowStateModal(true);
  };

  const handleRequestCloseStateModal = () => {
    const isDirty = Boolean(stateName.trim() || stateCode.trim());
    if (isDirty) {
      showConfirm({
        title: 'Descartar Alterações da Etapa?',
        subtitle: 'Alterações não salvas serão perdidas.',
        message: 'Você modificou campos desta etapa do Kanban. Deseja sair sem salvar?',
        confirmLabel: 'Sim, Descartar e Sair',
        cancelLabel: 'Continuar Editando',
        type: 'danger',
        onConfirm: handleCloseModal
      });
    } else {
      handleCloseModal();
    }
  };

  const handleSaveState = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateName.trim()) {
      showToast('Informe o nome da etapa do Kanban.', 'error');
      return;
    }

    const payload: Partial<WorkflowState> = {
      tenant_id: currentCompany.id,
      name: stateName.trim(),
      code: (stateCode || stateName.toUpperCase().replace(/\s+/g, '_')).trim(),
      color: stateColor,
      stage_type: stateStageType,
      is_initial: stateIsInitial,
      is_final: stateIsFinal
    };

    try {
      if (editingStateId) {
        AppStore.updateWorkflowState(editingStateId, payload, currentUser?.full_name || 'Admin');
        showToast(`Etapa "${stateName}" atualizada com sucesso!`);
      } else {
        AppStore.addWorkflowState(currentCompany.id, payload as any, currentUser?.full_name || 'Admin');
        showToast(`Etapa "${stateName}" adicionada ao Kanban!`);
      }
      handleCloseModal();
      onRefresh();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar etapa.', 'error');
    }
  };

  const handleDeleteState = (id: string, name: string) => {
    if (workflowStates.length <= 2) {
      showAlert(
        'Operação Não Permitida',
        'O Kanban da bancada técnica precisa ter pelo menos 2 etapas operacionais.',
        'Limite mínimo atingido',
        'warning'
      );
      return;
    }

    showConfirm({
      title: 'Remover Etapa do Kanban?',
      subtitle: 'Esta etapa será removida das colunas da bancada',
      message: `Deseja realmente remover a coluna "${name}" do fluxo Kanban?`,
      confirmLabel: 'Sim, Remover Etapa',
      type: 'danger',
      onConfirm: () => {
        try {
          AppStore.deleteWorkflowState(id, currentUser?.full_name || 'Admin');
          showToast(`Etapa "${name}" removida.`);
          onRefresh();
        } catch (err: any) {
          showToast(err?.message || 'Erro ao excluir etapa.', 'error');
        }
      }
    });
  };

  const handleMoveState = (index: number, direction: 'UP' | 'DOWN') => {
    const newIndex = direction === 'UP' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= workflowStates.length) return;
    
    const reordered = [...workflowStates];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    const stateIds = reordered.map(s => s.id);
    AppStore.reorderWorkflowStates(currentCompany.id, stateIds, currentUser?.full_name || 'Admin');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Colunas & Etapas da Bancada Técnica (Kanban)
          </h2>
          <p className="text-xs text-slate-400">
            Personalize as colunas do seu fluxo de trabalho: adicione novas etapas, altere cores, ordens e situações.
          </p>
        </div>
        {canManage && (
          <Button onClick={handleOpenAddState} className="bg-emerald-600 text-white font-bold text-xs gap-1.5 shadow-sm">
            <PlusCircle className="w-4 h-4" />
            Nova Etapa
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {workflowStates.map((st, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === workflowStates.length - 1;

          return (
            <div 
              key={st.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveState(idx, 'UP')}
                    disabled={isFirst}
                    className={cn("p-1.5 rounded-lg border text-slate-500", isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800")}
                    title="Mover para Cima / Esquerda"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveState(idx, 'DOWN')}
                    disabled={isLast}
                    className={cn("p-1.5 rounded-lg border text-slate-500", isLast ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800")}
                    title="Mover para Baixo / Direita"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full" style={{
                    backgroundColor: st.color === 'slate' ? '#64748b' : 
                      st.color === 'amber' ? '#f59e0b' : 
                      st.color === 'purple' ? '#a855f7' : 
                      st.color === 'blue' ? '#3b82f6' : 
                      st.color === 'teal' ? '#14b8a6' : 
                      st.color === 'emerald' ? '#10b981' : '#f43f5e'
                  }} />
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{st.name}</span>
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                        {st.code}
                      </Badge>
                      {st.is_initial && (
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px]">
                          Entrada
                        </Badge>
                      )}
                      {st.is_final && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                          Pronto
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tipo de Estágio: <span className="font-semibold text-slate-600 dark:text-slate-300">{st.stage_type}</span> • Posição: #{idx + 1}
                    </div>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-1 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditState(st)}
                    className="text-xs h-8 gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteState(st.id, st.name)}
                    className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Workflow Modal */}
      {showStateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 my-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Kanban className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  {editingStateId ? 'Editar Etapa do Kanban' : 'Nova Etapa / Coluna do Kanban'}
                </h3>
              </div>
              <button onClick={handleRequestCloseStateModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveState} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center mb-1">
                  <span>Nome da Etapa / Situação</span>
                  <span className="text-red-500 font-bold ml-1">*</span>
                </label>
                <Input
                  value={stateName}
                  onChange={e => setStateName(e.target.value)}
                  placeholder="Ex: Em Diagnóstico, Aguardando Peça, Banho Químico..."
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Código Mnemônico
                </label>
                <Input
                  value={stateCode}
                  onChange={e => setStateCode(e.target.value)}
                  placeholder="Ex: AGUARDANDO_PECA"
                  className="text-xs font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cor da Coluna
                  </label>
                  <Select
                    value={stateColor}
                    onChange={e => setStateColor(e.target.value as any)}
                    className="text-xs"
                  >
                    <option value="slate">Cinza (Slate)</option>
                    <option value="amber">Amarelo (Amber)</option>
                    <option value="purple">Roxo (Purple)</option>
                    <option value="blue">Azul (Blue)</option>
                    <option value="teal">Turquesa (Teal)</option>
                    <option value="emerald">Verde (Emerald)</option>
                    <option value="rose">Rosa / Vermelho (Rose)</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tipo de Estágio
                  </label>
                  <Select
                    value={stateStageType}
                    onChange={e => setStateStageType(e.target.value as any)}
                    className="text-xs"
                  >
                    <option value="RECEBIDO">Recepção / Entrada</option>
                    <option value="EM_ANDAMENTO">Em Execução</option>
                    <option value="AGUARDANDO_APROVACAO">Aguard. Aprovação</option>
                    <option value="CONCLUIDO">Concluído / Pronto</option>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={stateIsInitial}
                    onChange={e => setStateIsInitial(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Coluna de Entrada Inicial</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={stateIsFinal}
                    onChange={e => setStateIsFinal(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Coluna de Conclusão / Pronto</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={handleRequestCloseStateModal} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
                  <Check className="w-4 h-4" />
                  {editingStateId ? 'Salvar Etapa' : 'Adicionar Etapa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
