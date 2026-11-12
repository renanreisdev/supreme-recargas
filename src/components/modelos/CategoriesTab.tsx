'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Layers, 
  Check, 
  X, 
  ListPlus, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  FileCheck, 
  CheckSquare 
} from 'lucide-react';
import { ItemCategory, ItemModel, Service, CategoryCustomField, Company, Profile } from '@/types';
import { AppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface CategoriesTabProps {
  categories: ItemCategory[];
  models: ItemModel[];
  services: Service[];
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

export function CategoriesTab({
  categories,
  models,
  services,
  currentCompany,
  currentUser,
  canManage,
  onRefresh,
  showToast,
  showAlert,
  showConfirm,
  isCreateOpen = false,
  onCloseCreate
}: CategoriesTabProps) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIdentifierLabel, setCatIdentifierLabel] = useState('Nº de Série');
  const [catInspectionType, setCatInspectionType] = useState<string>('CHECKLIST');
  const [catInspectionTypeLabel, setCatInspectionTypeLabel] = useState('');
  const [catIcon, setCatIcon] = useState('Laptop');
  const [catChecklistItems, setCatChecklistItems] = useState<string[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState('');

  // Category Custom Optionals / Specifications builder
  const [catCustomFields, setCatCustomFields] = useState<CategoryCustomField[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'select' | 'text' | 'number' | 'checkbox'>('select');
  const [newFieldUnit, setNewFieldUnit] = useState('');
  const [newFieldOptionsInput, setNewFieldOptionsInput] = useState('');
  const [newFieldIncludeInDescription, setNewFieldIncludeInDescription] = useState(true);

  // Category Technical Verdicts / Resultados
  const [catTechnicalVerdicts, setCatTechnicalVerdicts] = useState<string[]>([]);
  const [editingVerdictIndex, setEditingVerdictIndex] = useState<number | null>(null);
  const [editingVerdictOldText, setEditingVerdictOldText] = useState<string | null>(null);
  const [newVerdictInput, setNewVerdictInput] = useState('');

  const handleCloseModal = () => {
    setShowCategoryModal(false);
    if (onCloseCreate) onCloseCreate();
  };

  const handleOpenAddCategory = () => {
    setEditingCategoryId(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatIdentifierLabel('Nº de Série');
    setCatInspectionType('CHECKLIST');
    setCatInspectionTypeLabel('');
    setCatIcon('Laptop');
    setCatChecklistItems([
      'Liga normalmente e dá vídeo',
      'Sem riscos ou trincas na carcaça',
      'Acompanha Carregador / Fonte Original'
    ]);
    setCatCustomFields([
      {
        id: 'f-1',
        name: 'Voltagem',
        type: 'select',
        options: ['Bivolt', '110V', '220V', 'Bateria / Recarregável'],
        include_in_description: true
      },
      {
        id: 'f-2',
        name: 'Potência',
        type: 'number',
        unit: 'W',
        include_in_description: false
      }
    ]);
    setCatTechnicalVerdicts([
      '100% OK / Concluído',
      'Reparo Concluído com Sucesso',
      'Reparado com Ressalvas',
      'Sem Reparo / Placa Inviável',
      'Aguardando Peça do Cliente',
      'Orçamento Reprovado / Devolvido'
    ]);
    setEditingFieldId(null);
    setEditingVerdictIndex(null);
    setEditingVerdictOldText(null);
    setNewChecklistInput('');
    setNewFieldName('');
    setNewFieldType('select');
    setNewFieldUnit('');
    setNewFieldOptionsInput('');
    setNewFieldIncludeInDescription(true);
    setNewVerdictInput('');
    setShowCategoryModal(true);
  };

  useEffect(() => {
    if (isCreateOpen) {
      handleOpenAddCategory();
    }
  }, [isCreateOpen]);

  const handleOpenEditCategory = (cat: ItemCategory) => {
    setEditingCategoryId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description || '');
    setCatIdentifierLabel(cat.identifier_label || 'Nº de Série');
    setCatInspectionType(cat.inspection_type || 'CHECKLIST');
    setCatInspectionTypeLabel(cat.inspection_type_label || '');
    setCatIcon(cat.icon || 'Laptop');
    setCatChecklistItems(cat.checklist_items || []);
    
    // Custom Fields fallback if empty
    let fields = cat.custom_fields || [];
    if (fields.length === 0) {
      if (cat.slug.includes('cartucho') || cat.slug.includes('toner')) {
        fields = [
          { id: 'f-cor', name: 'Cor / Tipo de Tinta', type: 'select', options: ['Preto', 'Tricolor', 'Ciano', 'Magenta', 'Amarelo'], include_in_description: true },
          { id: 'f-xl', name: 'Versão XL / Alta Capacidade', type: 'checkbox', include_in_description: true },
          { id: 'f-cap', name: 'Capacidade', type: 'number', unit: 'ml', include_in_description: false }
        ];
      } else if (cat.slug.includes('notebook') || cat.slug.includes('computador') || cat.slug.includes('pc')) {
        fields = [
          { id: 'f-ram', name: 'Memória RAM', type: 'select', options: ['4GB', '8GB', '16GB', '32GB', '64GB'], include_in_description: true },
          { id: 'f-ssd', name: 'Armazenamento SSD/HD', type: 'select', options: ['SSD 120GB', 'SSD 240GB', 'SSD 480GB', 'SSD 1TB', 'HD 500GB', 'HD 1TB'], include_in_description: true },
          { id: 'f-cpu', name: 'Processador / CPU', type: 'text', include_in_description: true },
          { id: 'f-volt', name: 'Voltagem / Fonte', type: 'select', options: ['Bivolt', '110V', '220V', 'Bateria'], include_in_description: false }
        ];
      } else {
        fields = [
          { id: 'f-volt', name: 'Voltagem / Alimentação', type: 'select', options: ['Bivolt', '110V', '220V', 'Trifásico', 'Bateria'], include_in_description: true },
          { id: 'f-pot', name: 'Potência', type: 'number', unit: 'W', include_in_description: false }
        ];
      }
    }
    setCatCustomFields(fields);

    // Technical Verdicts fallback if empty
    let verdicts = cat.technical_verdicts || [];
    if (verdicts.length === 0) {
      if (cat.slug.includes('cartucho') || cat.slug.includes('toner')) {
        verdicts = [
          '100% OK / Concluído',
          'CID / Circuito Queimado',
          'Queimado / Sem Reparo',
          'Entupido Irrecuperável',
          'Recusado / Devolvido'
        ];
      } else {
        verdicts = [
          '100% OK / Concluído',
          'Reparo Concluído com Sucesso',
          'Reparado com Ressalvas',
          'Sem Reparo / Placa Inviável',
          'Aguardando Peça do Cliente',
          'Orçamento Reprovado / Devolvido'
        ];
      }
    }
    setCatTechnicalVerdicts(verdicts);

    setEditingFieldId(null);
    setEditingVerdictIndex(null);
    setEditingVerdictOldText(null);
    setNewChecklistInput('');
    setNewFieldName('');
    setNewFieldType('select');
    setNewFieldUnit('');
    setNewFieldOptionsInput('');
    setNewFieldIncludeInDescription(true);
    setNewVerdictInput('');
    setShowCategoryModal(true);
  };

  const handleRequestCloseCategoryModal = () => {
    const isDirty = Boolean(
      catName.trim() ||
      catDesc.trim() ||
      catChecklistItems.length > 0 ||
      catCustomFields.length > 0 ||
      catTechnicalVerdicts.length > 0 ||
      newFieldName.trim() ||
      newChecklistInput.trim() ||
      newVerdictInput.trim()
    );

    if (isDirty) {
      showConfirm({
        title: 'Descartar Alterações da Categoria?',
        subtitle: 'Alterações não salvas serão perdidas.',
        message: 'As alterações feitas nesta categoria (opcionais, especificações, pareceres ou checklists) serão perdidas. Deseja realmente sair sem salvar?',
        confirmLabel: 'Sim, Descartar e Sair',
        cancelLabel: 'Continuar Editando',
        type: 'danger',
        onConfirm: handleCloseModal
      });
    } else {
      handleCloseModal();
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistInput.trim()) return;
    setCatChecklistItems([...catChecklistItems, newChecklistInput.trim()]);
    setNewChecklistInput('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setCatChecklistItems(catChecklistItems.filter((_, i) => i !== index));
  };

  const handleStartEditTechnicalVerdict = (index: number) => {
    setEditingVerdictIndex(index);
    setEditingVerdictOldText(catTechnicalVerdicts[index]);
    setNewVerdictInput(catTechnicalVerdicts[index]);
  };

  const handleCancelEditTechnicalVerdict = () => {
    setEditingVerdictIndex(null);
    setEditingVerdictOldText(null);
    setNewVerdictInput('');
  };

  const handleSaveTechnicalVerdict = () => {
    if (!newVerdictInput.trim()) return;
    const newVal = newVerdictInput.trim();

    if (editingVerdictIndex !== null) {
      const oldVal = editingVerdictOldText || catTechnicalVerdicts[editingVerdictIndex];

      const proceedUpdate = () => {
        const updated = [...catTechnicalVerdicts];
        updated[editingVerdictIndex] = newVal;
        setCatTechnicalVerdicts(updated);
        setEditingVerdictIndex(null);
        setEditingVerdictOldText(null);
        setNewVerdictInput('');
        showToast(`Parecer técnico atualizado para "${newVal}"!`);
      };

      if (newVal !== oldVal) {
        const orders = AppStore.getServiceOrders(currentCompany.id);
        let usedCount = 0;
        orders.forEach(ord => {
          ord.items?.forEach(item => {
            if (item.result_code === oldVal || item.result_description === oldVal) {
              usedCount++;
            }
          });
        });

        if (usedCount > 0) {
          showConfirm({
            title: 'Alterar Parecer em Uso?',
            subtitle: `${usedCount} item(ns) vinculado(s) no Kanban`,
            message: `O parecer técnico "${oldVal}" está sendo utilizado em ${usedCount} item(ns) no Kanban/Ordens de Serviço. Deseja realmente salvar a alteração para "${newVal}"?`,
            confirmLabel: 'Sim, Salvar Alteração',
            type: 'warning',
            onConfirm: proceedUpdate
          });
          return;
        }
      }

      proceedUpdate();
    } else {
      if (catTechnicalVerdicts.includes(newVal)) {
        showToast('Este parecer técnico já está cadastrado nesta categoria.', 'error');
        return;
      }
      setCatTechnicalVerdicts([...catTechnicalVerdicts, newVal]);
      setNewVerdictInput('');
      showToast(`Parecer técnico "${newVal}" adicionado!`);
    }
  };

  const handleRemoveTechnicalVerdict = (index: number) => {
    if (catTechnicalVerdicts.length <= 1) {
      showAlert(
        'Limite Mínimo',
        'A categoria deve ter pelo menos 1 parecer técnico cadastrado para seleção na bancada.',
        'Configuração obrigatória',
        'warning'
      );
      return;
    }

    const verdictText = catTechnicalVerdicts[index];
    const orders = AppStore.getServiceOrders(currentCompany.id);
    let usedCount = 0;
    orders.forEach(ord => {
      ord.items?.forEach(item => {
        if (item.result_code === verdictText || item.result_description === verdictText) {
          usedCount++;
        }
      });
    });

    if (usedCount > 0) {
      showAlert(
        'Exclusão Bloqueada',
        `Não é possível excluir o parecer técnico "${verdictText}" pois ele está registrado em ${usedCount} item(ns) no Kanban/Ordens de Serviço.`,
        'Parecer já utilizado em ordens de serviço',
        'danger'
      );
      return;
    }

    setCatTechnicalVerdicts(catTechnicalVerdicts.filter((_, i) => i !== index));
    if (editingVerdictIndex === index) {
      handleCancelEditTechnicalVerdict();
    }
    showToast(`Parecer "${verdictText}" removido.`);
  };

  const handleMoveTechnicalVerdict = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= catTechnicalVerdicts.length) return;
    const updated = [...catTechnicalVerdicts];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setCatTechnicalVerdicts(updated);
  };

  const handleStartEditCustomField = (field: CategoryCustomField) => {
    setEditingFieldId(field.id);
    setNewFieldName(field.name);
    setNewFieldType(field.type);
    setNewFieldUnit(field.unit || '');
    setNewFieldOptionsInput(field.options?.join(', ') || '');
    setNewFieldIncludeInDescription(field.include_in_description);
  };

  const handleCancelEditCustomField = () => {
    setEditingFieldId(null);
    setNewFieldName('');
    setNewFieldType('select');
    setNewFieldUnit('');
    setNewFieldOptionsInput('');
    setNewFieldIncludeInDescription(true);
  };

  const handleSaveCustomField = () => {
    if (!newFieldName.trim()) {
      showToast('Informe o nome da especificação / opcional.', 'error');
      return;
    }

    const optionsList = newFieldType === 'select'
      ? newFieldOptionsInput.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
      : undefined;

    if (editingFieldId) {
      setCatCustomFields(catCustomFields.map(f => f.id === editingFieldId ? {
        ...f,
        name: newFieldName.trim(),
        type: newFieldType,
        unit: newFieldType === 'number' ? newFieldUnit.trim() || undefined : undefined,
        options: optionsList && optionsList.length > 0 ? optionsList : undefined,
        include_in_description: newFieldIncludeInDescription
      } : f));
      setEditingFieldId(null);
      showToast(`Opcional "${newFieldName}" atualizado!`);
    } else {
      const newField: CategoryCustomField = {
        id: `f-${Date.now()}`,
        name: newFieldName.trim(),
        type: newFieldType,
        unit: newFieldType === 'number' ? newFieldUnit.trim() || undefined : undefined,
        options: optionsList && optionsList.length > 0 ? optionsList : undefined,
        include_in_description: newFieldIncludeInDescription
      };
      setCatCustomFields([...catCustomFields, newField]);
      showToast(`Opcional "${newFieldName}" adicionado!`);
    }

    setNewFieldName('');
    setNewFieldType('select');
    setNewFieldUnit('');
    setNewFieldOptionsInput('');
    setNewFieldIncludeInDescription(true);
  };

  const handleRemoveCustomField = (fieldId: string) => {
    const fieldObj = catCustomFields.find(f => f.id === fieldId);
    if (fieldObj) {
      const usedModels = models.filter(m => {
        if (editingCategoryId && m.category_id !== editingCategoryId) return false;
        const val = m.custom_attributes?.[fieldObj.name] ?? (m as any).attributes?.[fieldObj.name];
        return val !== undefined && val !== '' && val !== null && val !== false;
      });

      if (usedModels.length > 0) {
        showAlert(
          'Exclusão de Opcional Bloqueada',
          `Não é possível excluir o opcional "${fieldObj.name}" pois existem ${usedModels.length} modelo(s) cadastrado(s) utilizando este campo no catálogo.`,
          'Campo em uso por produtos',
          'danger'
        );
        return;
      }
    }

    setCatCustomFields(catCustomFields.filter(f => f.id !== fieldId));
    if (editingFieldId === fieldId) {
      handleCancelEditCustomField();
    }
  };

  const handleToggleFieldIncludeInDescription = (fieldId: string) => {
    setCatCustomFields(catCustomFields.map(f => f.id === fieldId ? { ...f, include_in_description: !f.include_in_description } : f));
  };

  const handleMoveCustomField = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= catCustomFields.length) return;
    const updated = [...catCustomFields];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setCatCustomFields(updated);
  };

  const handleBatchUpdateModelDescriptions = () => {
    if (!editingCategoryId) {
      showToast('Salve a categoria primeiro para poder atualizar os modelos em lote.', 'error');
      return;
    }

    const linkedModels = models.filter(m => m.category_id === editingCategoryId);
    if (linkedModels.length === 0) {
      showToast('Nenhum produto cadastrado nesta categoria para atualizar.', 'error');
      return;
    }

    showConfirm({
      title: 'Atualizar Descrições em Lote?',
      subtitle: `${linkedModels.length} produto(s) serão atualizados`,
      message: `Deseja atualizar a Descrição Completa de todos os ${linkedModels.length} produtos desta categoria de acordo com a ordem atual dos opcionais?`,
      confirmLabel: 'Sim, Atualizar Todos',
      type: 'info',
      onConfirm: () => {
        let updatedCount = 0;
        linkedModels.forEach(m => {
          const parts: string[] = [m.name.trim()];
          const attrs = m.custom_attributes || (m as any).attributes || {};

          catCustomFields.forEach(f => {
            if (f.include_in_description && attrs[f.name] !== undefined && attrs[f.name] !== '' && attrs[f.name] !== null) {
              const val = attrs[f.name];
              if (typeof val === 'boolean') {
                if (val) parts.push(f.name);
              } else {
                parts.push(f.unit ? `${val}${f.unit}` : String(val));
              }
            }
          });

          const newDesc = parts.join(' ').replace(/\s+/g, ' ').trim();
          AppStore.updateModel(m.id, { description: newDesc }, currentUser?.full_name || 'Admin');
          updatedCount++;
        });

        onRefresh();
        showToast(`Descrição de ${updatedCount} produto(s) atualizada com sucesso!`);
      }
    });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Informe o nome da categoria.', 'error');
      return;
    }

    const payload: Partial<ItemCategory> = {
      tenant_id: currentCompany.id,
      name: catName.trim(),
      slug: catSlug.trim() || catName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
      description: catDesc.trim() || undefined,
      identifier_label: catIdentifierLabel.trim() || 'Nº de Série',
      inspection_type: catInspectionType,
      inspection_type_label: catInspectionTypeLabel.trim() || undefined,
      checklist_items: catChecklistItems,
      custom_fields: catCustomFields,
      technical_verdicts: catTechnicalVerdicts,
      icon: catIcon,
      is_active: true
    };

    try {
      if (editingCategoryId) {
        AppStore.updateCategory(editingCategoryId, payload, currentUser?.full_name || 'Admin');
        showToast(`Categoria "${catName}" atualizada com sucesso!`);
      } else {
        AppStore.addCategory(payload as any, currentUser?.full_name || 'Admin');
        showToast(`Categoria "${catName}" cadastrada com sucesso!`);
      }
      handleCloseModal();
      onRefresh();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar categoria.', 'error');
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    const linkedModels = models.filter(m => m.category_id === id);
    if (linkedModels.length > 0) {
      showAlert(
        'Exclusão Bloqueada',
        `Não é possível excluir a categoria "${name}" pois existem ${linkedModels.length} modelo(s) cadastrado(s) nela. Realoque os modelos primeiro.`,
        'Existem modelos vinculados a esta categoria',
        'danger'
      );
      return;
    }

    showConfirm({
      title: 'Excluir Categoria?',
      subtitle: 'Esta ação não poderá ser desfeita',
      message: `Deseja realmente excluir a categoria "${name}"?`,
      confirmLabel: 'Sim, Excluir Categoria',
      type: 'danger',
      onConfirm: () => {
        try {
          AppStore.deleteCategory(id, currentUser?.full_name || 'Admin');
          showToast(`Categoria "${name}" excluída.`);
          onRefresh();
        } catch (err: any) {
          showToast(err?.message || 'Erro ao excluir categoria.', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Segmentação, Opcionais, Pareceres & Inspeções
          </h2>
          <p className="text-xs text-slate-400">
            Configure as categorias, opcionais técnicos, opções de parecer técnico e o tipo de inspeção do balcão.
          </p>
        </div>
        {canManage && (
          <Button onClick={handleOpenAddCategory} className="bg-emerald-600 text-white font-bold text-xs gap-1.5 shadow-sm">
            <PlusCircle className="w-4 h-4" />
            Nova Categoria
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const modelCount = models.filter(m => m.category_id === cat.id).length;
          const serviceCount = services.filter(s => s.category_ids?.includes(cat.id)).length;
          const checklistCount = cat.checklist_items?.length || 0;
          const customFieldsCount = cat.custom_fields?.length || 0;
          const verdictCount = cat.technical_verdicts?.length || 0;

          return (
            <Card key={cat.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {cat.name}
                      </CardTitle>
                      <p className="text-[11px] text-slate-400 font-mono">slug: {cat.slug}</p>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition-colors"
                        title="Editar Categoria"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition-colors"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-2.5">
                {cat.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {cat.description}
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Tipo de Inspeção:</span>
                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                      {cat.inspection_type_label || (cat.inspection_type === 'SCALE' ? '⚖️ Balança (g)' : cat.inspection_type === 'CHECKLIST' ? '📋 Checklist' : '🔧 ' + (cat.inspection_type || 'Padrão'))}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Opcionais Customizados:</span>
                    <Badge className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                      {customFieldsCount} especificação(ões)
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Pareceres no Kanban:</span>
                    <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      {verdictCount > 0 ? `${verdictCount} opções` : 'Padrão'}
                    </Badge>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-400">Checklist de Entrada:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{checklistCount} item(ns)</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Modelos Cadastrados:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{modelCount}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Serviços Vinculados:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{serviceCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 my-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  {editingCategoryId ? 'Editar Categoria & Engenharia' : 'Nova Categoria de Equipamentos'}
                </h3>
              </div>
              <button onClick={handleRequestCloseCategoryModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">1. Dados Básicos da Categoria</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center mb-1">
                      <span>Nome da Categoria</span>
                      <span className="text-red-500 font-bold ml-1">*</span>
                    </label>
                    <Input
                      value={catName}
                      onChange={e => setCatName(e.target.value)}
                      placeholder="Ex: Smartphones, Notebooks, Ferramentas..."
                      className="text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Rótulo do Serial / Código
                    </label>
                    <Input
                      value={catIdentifierLabel}
                      onChange={e => setCatIdentifierLabel(e.target.value)}
                      placeholder="Ex: IMEI / Serial, Nº de Série, Chassi..."
                      className="text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Tipo de Inspeção no Balcão (Personalizável)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Select
                        value={['CHECKLIST', 'SCALE', 'STANDARD'].includes(catInspectionType) ? catInspectionType : 'CUSTOM'}
                        onChange={e => {
                          const val = e.target.value;
                          setCatInspectionType(val);
                          if (val === 'CHECKLIST') setCatInspectionTypeLabel('Checklist Físico');
                          else if (val === 'SCALE') setCatInspectionTypeLabel('Balança / Pesagem (g)');
                          else if (val === 'STANDARD') setCatInspectionTypeLabel('Padrão');
                        }}
                        className="text-xs"
                      >
                        <option value="CHECKLIST">📋 Checklist Físico & Funcional</option>
                        <option value="SCALE">⚖️ Balança & Pesagem em Gramas (Cartuchos/Fluidos)</option>
                        <option value="STANDARD">🔧 Padrão / Sintomas Gerais</option>
                        <option value="CUSTOM">✨ Personalizado / Outro Tipo...</option>
                      </Select>

                      <Input
                        value={catInspectionTypeLabel}
                        onChange={e => {
                          setCatInspectionTypeLabel(e.target.value);
                          if (!['CHECKLIST', 'SCALE', 'STANDARD'].includes(catInspectionType)) {
                            setCatInspectionType(e.target.value || 'CUSTOM');
                          }
                        }}
                        placeholder="Nome personalizado da inspeção (ex: Inspeção Visual, Teste de Tensão...)"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Descrição Breve
                    </label>
                    <Input
                      value={catDesc}
                      onChange={e => setCatDesc(e.target.value)}
                      placeholder="Ex: Manutenção e reparos em geral..."
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Optionals & Specifications Builder with EDIT support & REORDERING & BATCH UPDATE */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <ListPlus className="w-4 h-4 text-purple-600" />
                      <span>2. Opcionais & Especificações Técnicas Desta Categoria</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Crie, edite e ordene os campos técnicos que compõem a descrição completa do produto.
                    </p>
                  </div>
                  <span className="text-[11px] text-purple-600 font-bold">{catCustomFields.length} campos</span>
                </div>

                {/* Add / Edit Custom Field Form */}
                <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200/60 dark:border-purple-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900 dark:text-purple-300">
                      {editingFieldId ? '✏️ Editar Opcional Selecionado' : '➕ Novo Opcional / Especificação'}
                    </span>
                    {editingFieldId && (
                      <button
                        type="button"
                        onClick={handleCancelEditCustomField}
                        className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                      >
                        Cancelar Edição
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center mb-0.5">
                        <span>Nome da Especificação / Opcional</span>
                        <span className="text-red-500 font-bold ml-1">*</span>
                      </label>
                      <Input
                        value={newFieldName}
                        onChange={e => setNewFieldName(e.target.value)}
                        placeholder="Ex: Cor, Voltagem, Memória RAM, Potência..."
                        className="text-xs h-8"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                        Tipo de Campo
                      </label>
                      <Select
                        value={newFieldType}
                        onChange={e => setNewFieldType(e.target.value as any)}
                        className="text-xs h-8"
                      >
                        <option value="select">Seleção (Múltiplas opções)</option>
                        <option value="text">Texto Livre</option>
                        <option value="number">Número</option>
                        <option value="checkbox">Caixa de Seleção (Sim/Não)</option>
                      </Select>
                    </div>
                  </div>

                  {newFieldType === 'number' && (
                    <div className="animate-in fade-in-0">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                        Unidade de Medida (opcional, ex: W, V, g, ml, GB, TB, mm, kg)
                      </label>
                      <Input
                        value={newFieldUnit}
                        onChange={e => setNewFieldUnit(e.target.value)}
                        placeholder="Ex: W, V, GB, ml"
                        maxLength={6}
                        className="text-xs h-8 w-32 font-mono font-bold"
                      />
                    </div>
                  )}

                  {newFieldType === 'select' && (
                    <div className="animate-in fade-in-0">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                        Possibilidades / Opções de Escolha (separadas por vírgula)
                      </label>
                      <Input
                        value={newFieldOptionsInput}
                        onChange={e => setNewFieldOptionsInput(e.target.value)}
                        placeholder="Ex: Preto, Tricolor, Ciano, Magenta ou 110V, 220V, Bivolt"
                        className="text-xs h-8"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={newFieldIncludeInDescription}
                        onChange={e => setNewFieldIncludeInDescription(e.target.checked)}
                        className="w-3.5 h-3.5 text-purple-600 rounded"
                      />
                      <span>Compor a descrição automática do produto</span>
                    </label>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveCustomField}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold h-7 gap-1"
                    >
                      {editingFieldId ? 'Salvar Opcional' : '+ Adicionar Campo'}
                    </Button>
                  </div>
                </div>

                {/* List of Custom Fields Configured for this Category with REORDERING */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {catCustomFields.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-2">
                      Nenhum opcional configurado nesta categoria.
                    </p>
                  ) : (
                    catCustomFields.map((field, idx) => (
                      <div 
                        key={field.id} 
                        className={cn(
                          "flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-colors",
                          editingFieldId === field.id 
                            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-700" 
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveCustomField(idx, 'UP')}
                              disabled={idx === 0}
                              className={cn(
                                "p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                                idx === 0 ? "opacity-20 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                              title="Mover para cima"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCustomField(idx, 'DOWN')}
                              disabled={idx === catCustomFields.length - 1}
                              className={cn(
                                "p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                                idx === catCustomFields.length - 1 ? "opacity-20 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                              title="Mover para baixo"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </span>

                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <span>{field.name}</span>
                              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px]">
                                {field.type === 'select' ? 'Seleção' : field.type === 'number' ? `Número${field.unit ? ` (${field.unit})` : ''}` : field.type === 'checkbox' ? 'Checkbox (Sim/Não)' : 'Texto'}
                              </Badge>
                              {field.include_in_description && (
                                <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[9px]">
                                  Compõe descrição
                                </Badge>
                              )}
                            </div>
                            {field.options && field.options.length > 0 && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Opções: {field.options.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditCustomField(field)}
                            className="p-1 rounded text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-purple-400 dark:hover:bg-slate-800"
                            title="Editar Opcional"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFieldIncludeInDescription(field.id)}
                            className="text-[10px] text-slate-400 hover:text-purple-600 px-1.5 py-0.5 border rounded"
                            title="Alternar se compõe descrição"
                          >
                            {field.include_in_description ? 'Desmarcar' : 'Marcar Descrição'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(field.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Excluir Opcional"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Batch Update Model Descriptions Button */}
                {editingCategoryId && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBatchUpdateModelDescriptions}
                      className="text-xs text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Atualizar Descrição de Todos os Produtos Desta Categoria
                    </Button>
                  </div>
                )}
              </div>

              {/* Section 3: Technical Verdicts / Resultados Personalizados por Categoria */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>3. Pareceres Técnicos & Resultados Desta Categoria (Kanban)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-bold">{catTechnicalVerdicts.length} opções</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Configure e ordene os pareceres técnicos que o técnico poderá escolher na bancada para equipamentos desta categoria. O primeiro item da lista será o padrão inicial.
                </p>

                {editingVerdictIndex !== null && (
                  <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs">
                    <span className="text-emerald-800 dark:text-emerald-200 font-bold">
                      ✏️ Editando parecer #{editingVerdictIndex + 1}: &quot;{editingVerdictOldText}&quot;
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelEditTechnicalVerdict}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                    >
                      Cancelar Edição
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={newVerdictInput}
                    onChange={e => setNewVerdictInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveTechnicalVerdict();
                      }
                    }}
                    placeholder="Ex: 100% OK / Concluído, Circuito Queimado, Sem Reparo..."
                    className="text-xs h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveTechnicalVerdict}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 h-8 gap-1"
                  >
                    {editingVerdictIndex !== null ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Salvar Parecer
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" />
                        Adicionar Parecer
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  {catTechnicalVerdicts.map((verdict, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === catTechnicalVerdicts.length - 1;
                    const isEditing = editingVerdictIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between gap-2 p-2 rounded-lg border text-xs transition-colors",
                          isEditing
                            ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-700"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveTechnicalVerdict(idx, 'UP')}
                              disabled={isFirst}
                              className={cn(
                                "p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                                isFirst ? "opacity-20 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                              title="Mover para cima"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveTechnicalVerdict(idx, 'DOWN')}
                              disabled={isLast}
                              className={cn(
                                "p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                                isLast ? "opacity-20 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                              title="Mover para baixo"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </span>

                          <span className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                            📋 {verdict}
                            {isFirst && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] px-1 py-0">
                                Padrão Inicial
                              </Badge>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditTechnicalVerdict(idx)}
                            className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition-colors"
                            title="Editar parecer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTechnicalVerdict(idx)}
                            className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition-colors"
                            title="Excluir parecer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Interactive Checklist Editor */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span>4. Checklist de Conferência de Entrada</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-bold">{catChecklistItems.length} itens</span>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newChecklistInput}
                    onChange={e => setNewChecklistInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    placeholder="Ex: Liga normalmente, Carcaça sem trincas..."
                    className="text-xs h-8"
                  />
                  <Button type="button" size="sm" onClick={handleAddChecklistItem} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shrink-0 h-8">
                    + Adicionar
                  </Button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  {catChecklistItems.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-2">
                      Nenhum item no checklist desta categoria.
                    </p>
                  ) : (
                    catChecklistItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">✓ {item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={handleRequestCloseCategoryModal} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
                  <Check className="w-4 h-4" />
                  {editingCategoryId ? 'Salvar Categoria' : 'Cadastrar Categoria'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
