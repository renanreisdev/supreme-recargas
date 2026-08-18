'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Scale, 
  CheckSquare, 
  ShieldAlert, 
  User, 
  FileText, 
  Check, 
  X,
  Sliders,
  PlusCircle,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  Kanban,
  GripVertical,
  Eye
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { ServiceOrderItem, WorkflowState, CompanySettings, KanbanColumnColor, StageType, ItemCategory } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { DialogModal, DialogModalProps } from '@/components/ui/dialog-modal';

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; headerBg: string; badge: string }> = {
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
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));
  const [searchFilter, setSearchFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<ServiceOrderItem | null>(null);

  // Technical Edit Modal State
  const [inputWeight, setInputWeight] = useState<string>('');
  const [outputWeight, setOutputWeight] = useState<string>('');
  const [resultCode, setResultCode] = useState<string>('100% OK / Concluído');
  const [resultDesc, setResultDesc] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState<string>('EM_RECARGA');
  const [modalAssignedTechId, setModalAssignedTechId] = useState<string>('');
  const [checklistState, setChecklistState] = useState<Array<{ item: string; checked: boolean }>>([]);

  // Workflow / Columns Customization Modal State
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showStateFormModal, setShowStateFormModal] = useState(false);
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [formStateName, setFormStateName] = useState('');
  const [formStateCode, setFormStateCode] = useState('');
  const [formStateColor, setFormStateColor] = useState<KanbanColumnColor>('blue');
  const [formStateStageType, setFormStateStageType] = useState<StageType>('EM_ANDAMENTO');
  const [formStateIsInitial, setFormStateIsInitial] = useState(false);
  const [formStateIsFinal, setFormStateIsFinal] = useState(false);

  // Global Dialog Modal (Replaces standard browser alert & confirm)
  const [dialogModal, setDialogModal] = useState<DialogModalProps | null>(null);

  // Drag & Drop Kanban State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverColumnCode, setDragOverColumnCode] = useState<string | null>(null);

  const canEditTech = hasPermission('update_tech_status') || hasPermission('technical_update') || currentUser?.role === 'ADMINISTRADOR';
  const canManageKanban = hasPermission('customize_kanban') || currentUser?.role === 'ADMINISTRADOR';
  const canChangeTechnician = hasPermission('change_assigned_technician') || currentUser?.role === 'ADMINISTRADOR';
  const canTransferAssignedItem = hasPermission('transfer_assigned_tech_order') || currentUser?.role === 'ADMINISTRADOR';
  const canEditOtherTechOrder = hasPermission('edit_other_technician_orders') || currentUser?.role === 'ADMINISTRADOR';

  const loadData = () => {
    const allItems = AppStore.getCartridges(currentCompany.id);
    const states = AppStore.getWorkflowStates(currentCompany.id);
    const cats = AppStore.getCategories(currentCompany.id);
    const stt = AppStore.getSettings(currentCompany.id);
    const usrs = AppStore.getUsers(currentCompany.id);

    setItems(allItems);
    setWorkflowStates(states);
    setCategories(cats);
    setSettings(stt);
    setTechnicians(AppStore.getEligibleTechnicians(currentCompany.id));
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

    const cat = categories.find(c => c.id === item.category_id || c.id === item.model?.category_id);
    const isScaleInspection = cat?.inspection_type === 'SCALE';
    const verdicts = (cat?.technical_verdicts && cat.technical_verdicts.length > 0)
      ? cat.technical_verdicts
      : isScaleInspection
        ? ['100% OK / Concluído', 'CID / Circuito Queimado', 'Queimado / Sem Reparo', 'Entupido Irrecuperável', 'Recusado / Devolvido']
        : ['100% OK / Concluído', 'Reparo Concluído com Sucesso', 'Reparado com Ressalvas', 'Sem Reparo / Placa Inviável', 'Aguardando Peça do Cliente', 'Orçamento Reprovado / Devolvido'];

    setInputWeight(inWeight);
    setOutputWeight(outWeight);
    setResultCode(item.result_code || verdicts[0] || '100% OK / Concluído');
    setResultDesc(item.result_description || '');
    setTechNotes(item.technical_notes || '');
    setTargetStatus(item.status);
    setModalAssignedTechId(item.assigned_technician_id || '');
    setChecklistState(item.checklist || []);
  };

  const handleToggleChecklist = (idx: number) => {
    if (!selectedItem) return;
    const isOtherTech = Boolean(selectedItem.assigned_technician_id && selectedItem.assigned_technician_id !== currentUser.id);
    if (isOtherTech && !canEditOtherTechOrder) return;
    setChecklistState(prev => prev.map((c, i) => i === idx ? { ...c, checked: !c.checked } : c));
  };

  const handleClaimItem = (item: ServiceOrderItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Se já tem técnico atribuído e não é o usuário logado
    if (item.assigned_technician_id && item.assigned_technician_id !== currentUser.id) {
      if (!canTransferAssignedItem) {
        setDialogModal({
          isOpen: true,
          type: 'warning',
          title: 'Permissão Insuficiente',
          subtitle: `Responsável: ${item.assigned_technician_name || 'Outro Técnico'}`,
          message: `Este item já está sob responsabilidade de "${item.assigned_technician_name || 'outro técnico'}". Seu perfil não possui a permissão "Transferir OS de Outro Técnico (Puxar para Si)".`,
          isAlertOnly: true,
          confirmLabel: 'Entendido',
          onConfirm: () => setDialogModal(null)
        });
        return;
      }

      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Transferir Responsabilidade do Item?',
        subtitle: `Atualmente com: ${item.assigned_technician_name || 'Outro Técnico'}`,
        message: `Deseja transferir a responsabilidade deste item (${item.model?.name || 'Item'} - S/N: ${item.internal_identifier}) para você (${currentUser.full_name})?`,
        confirmLabel: 'Sim, Transferir para Mim',
        cancelLabel: 'Cancelar',
        onCancel: () => setDialogModal(null),
        onConfirm: () => {
          setDialogModal(null);
          AppStore.assignOrderItemTechnician(item.id, currentUser.id, currentUser.full_name, currentUser.full_name);
          loadData();
        }
      });
      return;
    }

    // Se não tem técnico: assume diretamente
    AppStore.assignOrderItemTechnician(item.id, currentUser.id, currentUser.full_name, currentUser.full_name);
    loadData();
  };

  const handleSaveTechUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !canEditTech) return;

    // Verificar se o item é de outro técnico e se o usuário tem permissão para editar
    const isOtherTech = Boolean(selectedItem.assigned_technician_id && selectedItem.assigned_technician_id !== currentUser.id);
    if (isOtherTech && !canEditOtherTechOrder) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Permissão Insuficiente',
        subtitle: 'Apenas visualização autorizada',
        message: `Esta OS está sob responsabilidade do técnico "${selectedItem.assigned_technician_name || 'outro profissional'}". Seu usuário não possui a permissão "Alterar / Editar OS de Outro Técnico".`,
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }

    // Verificar se o técnico foi alterado e validar permissão específica
    if (modalAssignedTechId && modalAssignedTechId !== (selectedItem.assigned_technician_id || '')) {
      if (modalAssignedTechId === currentUser.id) {
        // Puxando item já atribuído a outro técnico para si
        if (selectedItem.assigned_technician_id && selectedItem.assigned_technician_id !== currentUser.id && !canTransferAssignedItem) {
          setDialogModal({
            isOpen: true,
            type: 'warning',
            title: 'Permissão Insuficiente',
            subtitle: 'Transferência de item não autorizada',
            message: 'Seu perfil de usuário não possui a permissão "Transferir OS de Outro Técnico (Puxar para Si)".',
            isAlertOnly: true,
            confirmLabel: 'Entendido',
            onConfirm: () => setDialogModal(null)
          });
          return;
        }
      } else {
        // Reatribuindo para outro técnico (não para si)
        if (!canChangeTechnician) {
          setDialogModal({
            isOpen: true,
            type: 'warning',
            title: 'Permissão Insuficiente',
            subtitle: 'Alteração de técnico não autorizada',
            message: 'Seu perfil de usuário não possui a permissão "Alterar Técnico da OS para Outro Técnico".',
            isAlertOnly: true,
            confirmLabel: 'Entendido',
            onConfirm: () => setDialogModal(null)
          });
          return;
        }
      }
    }

    const inNum = inputWeight ? parseFloat(inputWeight) : undefined;
    const outNum = outputWeight ? parseFloat(outputWeight) : undefined;
    const assignedTechProfile = technicians.find(t => t.id === modalAssignedTechId);

    AppStore.updateOrderItemStatus(selectedItem.id, {
      status: targetStatus,
      result_code: resultCode,
      result_description: resultDesc,
      technical_notes: techNotes,
      assigned_technician_id: modalAssignedTechId || selectedItem.assigned_technician_id || currentUser.id,
      assigned_technician_name: assignedTechProfile ? assignedTechProfile.full_name : (modalAssignedTechId ? undefined : (selectedItem.assigned_technician_name || currentUser.full_name)),
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

    // Verificar se o item é de outro técnico e se o usuário tem permissão para editar
    const isOtherTech = Boolean(selectedItem.assigned_technician_id && selectedItem.assigned_technician_id !== currentUser.id);
    if (isOtherTech && !canEditOtherTechOrder) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Permissão Insuficiente',
        subtitle: 'Apenas visualização autorizada',
        message: `Esta OS está sob responsabilidade do técnico "${selectedItem.assigned_technician_name || 'outro profissional'}". Seu usuário não possui permissão para aprovar ou alterar itens de outros técnicos.`,
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }

    const outNum = outputWeight ? parseFloat(outputWeight) : undefined;
    const cat = categories.find(c => c.id === selectedItem.category_id || c.id === selectedItem.model?.category_id);
    const isScaleInspection = cat?.inspection_type === 'SCALE';
    const verdicts = (cat?.technical_verdicts && cat.technical_verdicts.length > 0)
      ? cat.technical_verdicts
      : isScaleInspection
        ? ['100% OK / Concluído', 'CID / Circuito Queimado', 'Queimado / Sem Reparo', 'Entupido Irrecuperável', 'Recusado / Devolvido']
        : ['100% OK / Concluído', 'Reparo Concluído com Sucesso', 'Reparado com Ressalvas', 'Sem Reparo / Placa Inviável', 'Aguardando Peça do Cliente', 'Orçamento Reprovado / Devolvido'];

    const successVerdict = verdicts[0] || '100% OK / Concluído';

    AppStore.updateOrderItemStatus(selectedItem.id, {
      status: 'FINALIZADO',
      result_code: successVerdict,
      technical_notes: techNotes || 'Testado, aprovado e finalizado na bancada técnica.',
      assigned_technician_id: selectedItem.assigned_technician_id || currentUser.id,
      assigned_technician_name: selectedItem.assigned_technician_name || currentUser.full_name,
      custom_field_values: {
        ...(selectedItem.custom_field_values || {}),
        output_weight_grams: outNum
      },
      checklist: checklistState.map(c => ({ ...c, checked: true }))
    }, currentUser.full_name);

    setSelectedItem(null);
  };

  // ==========================================
  // KANBAN DRAG & DROP HANDLERS
  // ==========================================
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    if (!canEditTech) return;
    const item = items.find(it => it.id === itemId);
    if (item && item.assigned_technician_id && item.assigned_technician_id !== currentUser.id && !canEditOtherTechOrder) {
      e.preventDefault();
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Ação Não Permitida',
        subtitle: `Responsável: ${item.assigned_technician_name || 'Outro Técnico'}`,
        message: 'Você pode visualizar este item, mas não possui permissão para alterar ou movimentar a etapa de uma OS atribuída a outro técnico.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverColumnCode(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, stateCode: string) => {
    if (!canEditTech) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnCode !== stateCode) {
      setDragOverColumnCode(stateCode);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverColumnCode(null);
  };

  const handleDropOnColumn = (e: React.DragEvent, targetStateCode: string) => {
    if (!canEditTech) return;
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain') || draggedItemId;
    setDragOverColumnCode(null);
    setDraggedItemId(null);

    if (!itemId) return;

    const item = items.find(it => it.id === itemId);
    if (!item) return;

    if (item.assigned_technician_id && item.assigned_technician_id !== currentUser.id && !canEditOtherTechOrder) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Ação Não Permitida',
        subtitle: `Responsável: ${item.assigned_technician_name || 'Outro Técnico'}`,
        message: 'Você não possui permissão para alterar a etapa ou dados de uma OS atribuída a outro técnico.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }

    // Don't update if already in target column
    if (item.status === targetStateCode) return;

    const targetState = workflowStates.find(s => s.code === targetStateCode);
    if (!targetState) return;

    try {
      AppStore.updateOrderItemStatus(
        itemId,
        {
          status: targetStateCode,
          current_state_id: targetState.id,
          assigned_technician_id: item.assigned_technician_id || currentUser?.id,
          assigned_technician_name: item.assigned_technician_name || (item.assigned_technician_id ? undefined : currentUser?.full_name),
          technical_notes: item.technical_notes || `Movido para ${targetState.name} no Kanban`
        },
        currentUser?.full_name || 'Técnico'
      );
      loadData();
    } catch (err: any) {
      setDialogModal({
        isOpen: true,
        type: 'danger',
        title: 'Erro ao Mover Item',
        message: err?.message || 'Não foi possível mover o item para a coluna selecionada.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
    }
  };

  // ==========================================
  // WORKFLOW STAGES CUSTOMIZATION HANDLERS
  // ==========================================
  const handleOpenAddState = () => {
    setEditingStateId(null);
    setFormStateName('');
    setFormStateCode('');
    setFormStateColor('blue');
    setFormStateStageType('EM_ANDAMENTO');
    setFormStateIsInitial(false);
    setFormStateIsFinal(false);
    setShowStateFormModal(true);
  };

  const handleOpenEditState = (st: WorkflowState) => {
    setEditingStateId(st.id);
    setFormStateName(st.name);
    setFormStateCode(st.code);
    setFormStateColor(st.color || 'blue');
    setFormStateStageType(st.stage_type || 'EM_ANDAMENTO');
    setFormStateIsInitial(Boolean(st.is_initial));
    setFormStateIsFinal(Boolean(st.is_final));
    setShowStateFormModal(true);
  };

  const handleSaveStateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStateName.trim()) return;

    const payload: Partial<WorkflowState> = {
      tenant_id: currentCompany.id,
      name: formStateName.trim(),
      code: (formStateCode || formStateName.toUpperCase().replace(/\s+/g, '_')).trim(),
      color: formStateColor,
      stage_type: formStateStageType,
      is_initial: formStateIsInitial,
      is_final: formStateIsFinal
    };

    if (editingStateId) {
      AppStore.updateWorkflowState(editingStateId, payload, currentUser.full_name);
    } else {
      AppStore.addWorkflowState(currentCompany.id, payload as any, currentUser.full_name);
    }

    setShowStateFormModal(false);
    loadData();
  };

  const handleDeleteState = (id: string, name: string) => {
    if (workflowStates.length <= 2) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Operação Não Permitida',
        subtitle: 'Limite mínimo atingido',
        message: 'O Kanban da bancada técnica precisa ter pelo menos 2 etapas operacionais.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }

    setDialogModal({
      isOpen: true,
      type: 'danger',
      title: 'Remover Coluna do Kanban?',
      subtitle: 'Esta ação não poderá ser desfeita',
      message: `Deseja realmente remover a coluna "${name}" do Kanban?`,
      confirmLabel: 'Sim, Remover Coluna',
      cancelLabel: 'Cancelar',
      onCancel: () => setDialogModal(null),
      onConfirm: () => {
        setDialogModal(null);
        AppStore.deleteWorkflowState(id, currentUser.full_name);
        loadData();
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
    AppStore.reorderWorkflowStates(currentCompany.id, stateIds, currentUser.full_name);
    loadData();
  };

  // Filter items based on search and technician filter
  const filteredItems = items.filter(it => {
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase().trim();
      const modelName = it.model?.name || '';
      const serial = it.internal_identifier || '';
      const cust = it.customer_name || '';
      const osNum = it.order_number || '';
      const tech = it.assigned_technician_name || '';
      const matches = modelName.toLowerCase().includes(query) ||
        serial.toLowerCase().includes(query) ||
        cust.toLowerCase().includes(query) ||
        osNum.toLowerCase().includes(query) ||
        tech.toLowerCase().includes(query);
      if (!matches) return false;
    }

    // Technician filter (default: 'ALL')
    if (technicianFilter === 'ALL') return true;
    if (technicianFilter === 'UNASSIGNED') return !it.assigned_technician_id;
    if (technicianFilter === 'MINE') return it.assigned_technician_id === currentUser.id;
    return it.assigned_technician_id === technicianFilter;
  });

  const getItemsForState = (statusCode: string) => {
    return filteredItems.filter(it => it.status === statusCode);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Global Dialog Modal */}
      {dialogModal && <DialogModal {...dialogModal} />}

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

        {/* Search, Technician Filter & Customization Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por OS, serial ou cliente..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={technicianFilter}
              onChange={e => setTechnicianFilter(e.target.value)}
              className="h-9 text-xs rounded-xl font-medium border-slate-300 dark:border-slate-700"
              title="Filtrar itens por técnico responsável"
            >
              <option value="ALL">👤 Todos os Técnicos (Padrão)</option>
              <option value="UNASSIGNED">⚡ Sem Técnico (Disponíveis)</option>
              <option value="MINE">⭐ Meus Itens ({currentUser.full_name})</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>
                  👤 {tech.full_name} ({tech.group_name || (tech.role === 'TECNICO' ? 'Técnico' : tech.role === 'ADMINISTRADOR' ? 'Admin' : 'Equipe')})
                </option>
              ))}
            </Select>
          </div>

          {canManageKanban && (
            <Button
              onClick={() => setShowWorkflowModal(true)}
              variant="outline"
              className="h-9 px-3 text-xs font-bold rounded-xl border-slate-300 dark:border-slate-700 gap-1.5 shrink-0 hover:border-emerald-500"
              title="Personalizar Colunas e Situações do Kanban"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Personalizar Kanban</span>
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {workflowStates.map(state => {
          const colItems = getItemsForState(state.code);
          const colorStyles = COLOR_MAP[state.color] || COLOR_MAP.slate;
          const isDragOver = dragOverColumnCode === state.code;

          return (
            <div
              key={state.code}
              onDragOver={(e) => handleDragOverColumn(e, state.code)}
              onDragLeave={handleDragLeaveColumn}
              onDrop={(e) => handleDropOnColumn(e, state.code)}
              className={`w-80 shrink-0 rounded-2xl border transition-all duration-150 flex flex-col max-h-[calc(100vh-220px)] shadow-sm ${colorStyles.border} ${colorStyles.bg} ${
                isDragOver ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10 shadow-lg scale-[1.01]' : ''
              }`}
            >
              {/* Column Header */}
              <div className={`p-3.5 ${colorStyles.headerBg} rounded-t-2xl flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                  <h3 className={`text-xs font-extrabold tracking-wide uppercase ${colorStyles.text}`}>
                    {state.name}
                  </h3>
                </div>
                <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorStyles.badge}`}>
                  {colItems.length}
                </Badge>
              </div>

              {/* Column Content / Cards List */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1 scrollbar-thin">
                {colItems.length === 0 ? (
                  <div className={`py-8 text-center border border-dashed rounded-xl transition-colors ${
                    isDragOver 
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}>
                    <p className={`text-[11px] font-medium ${isDragOver ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {isDragOver ? 'Soltar item aqui' : 'Nenhum item nesta etapa'}
                    </p>
                  </div>
                ) : (
                  colItems.map(item => {
                    const inW = item.custom_field_values?.input_weight_grams;
                    const outW = item.custom_field_values?.output_weight_grams;
                    const diffW = (outW !== undefined && inW !== undefined) ? (outW - inW).toFixed(1) : null;
                    const isBeingDragged = draggedItemId === item.id;
                    const displayModelName = settings.item_description_display_mode === 'FULL'
                      ? (item.model?.description || item.model?.name || 'Modelo não especificado')
                      : (item.model?.name || 'Modelo não especificado');

                    return (
                      <div
                        key={item.id}
                        draggable={canEditTech}
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleOpenItem(item)}
                        className={`bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all space-y-2.5 group select-none ${
                          canEditTech ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                        } ${
                          isBeingDragged ? 'opacity-40 scale-95 border-dashed border-emerald-500 ring-2 ring-emerald-500/30' : ''
                        }`}
                      >
                        {/* OS Header & Identifier */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-start gap-1.5 overflow-hidden">
                            {canEditTech && (
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 shrink-0 mt-0.5 transition-colors" />
                            )}
                            <div className="overflow-hidden">
                              <span className="text-[10px] font-mono font-bold text-slate-400 block">
                                OS #{item.order_number || '2026-000000'}
                              </span>
                              <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors truncate" title={displayModelName}>
                                {displayModelName}
                              </div>
                            </div>
                          </div>
                          {item.internal_identifier && (
                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase shrink-0">
                              {item.internal_identifier}
                            </Badge>
                          )}
                        </div>

                        {/* Customer */}
                        {item.customer_name && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{item.customer_name}</span>
                          </div>
                        )}

                        {/* Services preview */}
                        {item.services && item.services.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.services.map((srv, sIdx) => (
                              <span key={sIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                                {srv.service_name || 'Serviço'}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Weight info if refill */}
                        {(inW !== undefined || outW !== undefined) && (
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Scale className="w-3 h-3 text-amber-500" />
                              Entrada: {inW !== undefined ? `${inW}g` : '--'}
                            </span>
                            {diffW !== null && (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                +{diffW}g líquido
                              </span>
                            )}
                          </div>
                        )}

                        {/* Technician Info / Claim Button */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-1 text-[10px]">
                          {item.assigned_technician_name ? (
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium truncate" title={`Técnico Responsável: ${item.assigned_technician_name}`}>
                              <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[9px] font-bold shrink-0">
                                {item.assigned_technician_name.charAt(0).toUpperCase()}
                              </span>
                              <span className="truncate">{item.assigned_technician_name}</span>
                              {item.assigned_technician_id !== currentUser.id && !canEditOtherTechOrder && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal shrink-0 flex items-center gap-0.5" title="Apenas visualização autorizada">
                                  <Eye className="w-2.5 h-2.5" />
                                  Leitura
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Sem Técnico</span>
                            </div>
                          )}

                          {(!item.assigned_technician_id || item.assigned_technician_id !== currentUser.id) && (
                            <button
                              type="button"
                              onClick={(e) => handleClaimItem(item, e)}
                              className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 transition-colors shrink-0"
                              title={!item.assigned_technician_id ? "Assumir este item para mim" : "Transferir responsabilidade para mim"}
                            >
                              {!item.assigned_technician_id ? '+ Pegar p/ Mim' : 'Transferir'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EXECUÇÃO TÉCNICA DO ITEM */}
      {/* ========================================================================= */}
      {selectedItem && (() => {
        const itemCat = categories.find(c => c.id === selectedItem.category_id || c.id === selectedItem.model?.category_id);
        const isScaleInspection = itemCat?.inspection_type === 'SCALE';
        const modalModelName = settings.item_description_display_mode === 'FULL'
          ? (selectedItem.model?.description || selectedItem.model?.name || 'Equipamento')
          : (selectedItem.model?.name || 'Equipamento');
        const isOtherTech = Boolean(selectedItem.assigned_technician_id && selectedItem.assigned_technician_id !== currentUser.id);
        const isReadOnlyMode = isOtherTech && !canEditOtherTechOrder;
        const availableVerdicts: string[] = (itemCat?.technical_verdicts && itemCat.technical_verdicts.length > 0)
          ? itemCat.technical_verdicts
          : isScaleInspection
            ? [
                '100% OK / Concluído',
                'CID / Circuito Queimado',
                'Queimado / Sem Reparo',
                'Entupido Irrecuperável',
                'Recusado / Devolvido'
              ]
            : [
                '100% OK / Concluído',
                'Reparo Concluído com Sucesso',
                'Reparado com Ressalvas',
                'Sem Reparo / Placa Inviável',
                'Aguardando Peça do Cliente',
                'Orçamento Reprovado / Devolvido'
              ];

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 my-8">
              <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">OS #{selectedItem.order_number}</span>
                    {isReadOnlyMode && (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[9px] gap-1">
                        <Eye className="w-3 h-3" />
                        Modo Visualização
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-base" title={modalModelName}>
                    {modalModelName}
                  </h3>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTechUpdate} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Read-Only Notice if assigned to another technician */}
                {isReadOnlyMode && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
                    <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold">Modo de Visualização:</span> Este item está atribuído ao técnico <strong>{selectedItem.assigned_technician_name || 'outro profissional'}</strong>. Você pode consultar os detalhes, mas não possui permissão para editar informações.
                    </div>
                  </div>
                )}

                {/* Target Status & Responsible Technician Selects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Mover para Situação / Etapa:
                    </label>
                    <Select
                      value={targetStatus}
                      onChange={e => setTargetStatus(e.target.value)}
                      disabled={isReadOnlyMode}
                      className="text-xs font-bold"
                    >
                      {workflowStates.map(st => (
                        <option key={st.code} value={st.code}>
                          {st.name} ({st.code})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Técnico Responsável:
                      </label>
                      {!canChangeTechnician && Boolean(selectedItem.assigned_technician_id) && (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[9px]">
                          Fixo
                        </Badge>
                      )}
                    </div>
                    <Select
                      value={modalAssignedTechId}
                      onChange={e => setModalAssignedTechId(e.target.value)}
                      disabled={isReadOnlyMode || (!canChangeTechnician && Boolean(selectedItem.assigned_technician_id))}
                      className="text-xs font-bold"
                    >
                      <option value="">-- Sem Técnico Atribuído --</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.full_name} ({t.group_name || (t.role === 'TECNICO' ? 'Técnico' : t.role === 'ADMINISTRADOR' ? 'Admin' : 'Equipe')})
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Weight Scale Inputs ONLY IF INSPECTION TYPE IS SCALE */}
                {isScaleInspection && (
                  <div className="grid grid-cols-2 gap-3 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                    <div>
                      <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-1">
                        ⚖️ Peso de Entrada (g)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={inputWeight}
                        onChange={e => setInputWeight(e.target.value)}
                        disabled={isReadOnlyMode}
                        placeholder="Ex: 28.5"
                        className="text-xs font-bold bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-1">
                        ⚖️ Peso de Saída (g)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={outputWeight}
                        onChange={e => setOutputWeight(e.target.value)}
                        disabled={isReadOnlyMode}
                        placeholder="Ex: 38.0"
                        className="text-xs font-bold bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Checklist verification if present */}
                {checklistState.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Checklist de Inspeção do Equipamento:
                    </label>
                    <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      {checklistState.map((chk, cIdx) => (
                        <label key={cIdx} className={cn("flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300", isReadOnlyMode ? "cursor-not-allowed opacity-80" : "cursor-pointer")}>
                          <input
                            type="checkbox"
                            checked={chk.checked}
                            disabled={isReadOnlyMode}
                            onChange={() => handleToggleChecklist(cIdx)}
                            className="w-3.5 h-3.5 text-emerald-600 rounded disabled:opacity-50"
                          />
                          <span>{chk.item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result Code & Notes */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Parecer Técnico / Resultado:
                      </label>
                      <Select
                        value={resultCode}
                        onChange={e => setResultCode(e.target.value)}
                        disabled={isReadOnlyMode}
                        className="text-xs"
                      >
                        {availableVerdicts.map((verdict, vIdx) => (
                          <option key={vIdx} value={verdict}>
                            {verdict}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Detalhe do Parecer:
                      </label>
                      <Input
                        value={resultDesc}
                        onChange={e => setResultDesc(e.target.value)}
                        disabled={isReadOnlyMode}
                        placeholder="Ex: Teste padrão perfeito"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Observações Internas da Bancada:
                    </label>
                    <Input
                      value={techNotes}
                      onChange={e => setTechNotes(e.target.value)}
                      disabled={isReadOnlyMode}
                      placeholder="Anotações para controle interno..."
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  {!isReadOnlyMode ? (
                    <Button
                      type="button"
                      onClick={handleQuickApprove}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Aprovação Rápida (100% OK)
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                      <Eye className="w-3.5 h-3.5" />
                      Visualização de OS de outro técnico
                    </span>
                  )}

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedItem(null)} className="text-xs">
                      Fechar
                    </Button>
                    {!isReadOnlyMode && (
                      <Button type="submit" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs">
                        Salvar Alterações
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: PERSONALIZAÇÃO GERAL DO KANBAN & ETAPAS */}
      {/* ========================================================================= */}
      {showWorkflowModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 my-8">
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Kanban className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  Personalizar Colunas do Kanban
                </h3>
              </div>
              <button onClick={() => setShowWorkflowModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  Reordene as colunas ou adicione novas etapas conforme a rotina da sua oficina.
                </p>
                <Button onClick={handleOpenAddState} size="sm" className="bg-emerald-600 text-white text-xs font-bold gap-1">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Nova Etapa
                </Button>
              </div>

              <div className="space-y-2">
                {workflowStates.map((st, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === workflowStates.length - 1;

                  return (
                    <div key={st.id} className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleMoveState(idx, 'UP')}
                            disabled={isFirst}
                            className={cn("p-1 rounded border text-slate-500", isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-200 dark:hover:bg-slate-700")}
                            title="Mover para Cima"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveState(idx, 'DOWN')}
                            disabled={isLast}
                            className={cn("p-1 rounded border text-slate-500", isLast ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-200 dark:hover:bg-slate-700")}
                            title="Mover para Baixo"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-bold text-slate-900 dark:text-slate-100">{st.name}</span>
                        <Badge className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[9px]">
                          {st.code}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditState(st)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteState(st.id, st.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button onClick={() => setShowWorkflowModal(false)} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold">
                  Concluir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR ETAPA ESPECÍFICA */}
      {/* ========================================================================= */}
      {showStateFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 my-8">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {editingStateId ? 'Editar Etapa do Kanban' : 'Nova Etapa do Kanban'}
              </h3>
              <button onClick={() => setShowStateFormModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStateForm} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Etapa *
                </label>
                <Input
                  value={formStateName}
                  onChange={e => setFormStateName(e.target.value)}
                  placeholder="Ex: Em Diagnóstico, Aguardando Peça..."
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Código
                </label>
                <Input
                  value={formStateCode}
                  onChange={e => setFormStateCode(e.target.value)}
                  placeholder="Ex: AGUARDANDO_PECA"
                  className="text-xs font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cor
                  </label>
                  <Select
                    value={formStateColor}
                    onChange={e => setFormStateColor(e.target.value as any)}
                    className="text-xs"
                  >
                    <option value="slate">Cinza</option>
                    <option value="amber">Amarelo</option>
                    <option value="purple">Roxo</option>
                    <option value="blue">Azul</option>
                    <option value="teal">Turquesa</option>
                    <option value="emerald">Verde</option>
                    <option value="rose">Rosa / Vermelho</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tipo de Estágio
                  </label>
                  <Select
                    value={formStateStageType}
                    onChange={e => setFormStateStageType(e.target.value as any)}
                    className="text-xs"
                  >
                    <option value="RECEBIDO">Entrada</option>
                    <option value="EM_ANDAMENTO">Em Execução</option>
                    <option value="AGUARDANDO_APROVACAO">Aguard. Aprovação</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowStateFormModal(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
