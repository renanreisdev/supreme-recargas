'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tag, 
  Search, 
  PlusCircle, 
  Check, 
  DollarSign, 
  Edit3, 
  Info,
  X,
  Wrench, 
  Clock, 
  Trash2, 
  Layers,
  Sparkles,
  Building,
  Scale,
  CheckSquare,
  Cpu,
  Smartphone,
  Laptop,
  Printer,
  Sliders,
  AlertCircle,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Kanban
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { ItemModel, ItemCategory, Brand, Service, WorkflowState, KanbanColumnColor, StageType } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function CatalogAndModelsPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'MODELS' | 'SERVICES' | 'CATEGORIES' | 'BRANDS' | 'WORKFLOW'>('MODELS');
  
  const [models, setModels] = useState<ItemModel[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([]);
  
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ==========================================
  // MODEL MODAL STATE & OPTIONALS
  // ==========================================
  const [showModelModal, setShowModelModal] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelBrandId, setModelBrandId] = useState('');
  const [modelCategoryId, setModelCategoryId] = useState('');
  const [modelInternalCode, setModelInternalCode] = useState('');
  const [modelBarcode, setModelBarcode] = useState('');
  const [modelDesc, setModelDesc] = useState('');
  
  // Specific optionals
  const [modelColor, setModelColor] = useState('');
  const [modelIsXl, setModelIsXl] = useState(false);
  const [modelCapacityMl, setModelCapacityMl] = useState('');
  const [modelEmptyWeight, setModelEmptyWeight] = useState('');
  const [modelFullWeight, setModelFullWeight] = useState('');
  const [modelVoltage, setModelVoltage] = useState('Bivolt');
  const [modelPowerSpecs, setModelPowerSpecs] = useState('');
  const [modelHardwareSpecs, setModelHardwareSpecs] = useState('');
  const [modelRecommendedAccessories, setModelRecommendedAccessories] = useState('');
  const [modelServicePrices, setModelServicePrices] = useState<Record<string, string>>({});

  // ==========================================
  // SERVICE MODAL STATE & CATEGORY LINKING
  // ==========================================
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('50.00');
  const [serviceEstTime, setServiceEstTime] = useState('45');
  const [selectedServiceCategories, setSelectedServiceCategories] = useState<string[]>([]);

  // ==========================================
  // CATEGORY MODAL STATE & CHECKLIST
  // ==========================================
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIdentifierLabel, setCatIdentifierLabel] = useState('Nº de Série');
  const [catInspectionType, setCatInspectionType] = useState<'SCALE' | 'CHECKLIST' | 'STANDARD'>('CHECKLIST');
  const [catIcon, setCatIcon] = useState('Laptop');
  const [catChecklistItems, setCatChecklistItems] = useState<string[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState('');

  // ==========================================
  // BRAND MODAL STATE
  // ==========================================
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');

  // ==========================================
  // WORKFLOW STATE MODAL STATE
  // ==========================================
  const [showStateModal, setShowStateModal] = useState(false);
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [stateName, setStateName] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [stateColor, setStateColor] = useState<KanbanColumnColor>('blue');
  const [stateStageType, setStateStageType] = useState<StageType>('EM_ANDAMENTO');
  const [stateIsInitial, setStateIsInitial] = useState(false);
  const [stateIsFinal, setStateIsFinal] = useState(false);

  const canManage = hasPermission('manage_models') || hasPermission('catalog_manage') || currentUser?.role === 'ADMINISTRADOR';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = () => {
    const mods = AppStore.getModels(currentCompany.id);
    const cats = AppStore.getCategories(currentCompany.id);
    const brs = AppStore.getBrands(currentCompany.id);
    const srvs = AppStore.getServices(currentCompany.id);
    const wfs = AppStore.getWorkflowStates(currentCompany.id);

    setModels(mods);
    setCategories(cats);
    setBrands(brs);
    setServices(srvs);
    setWorkflowStates(wfs);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  // Selected category info for dynamic form helper
  const activeSelectedCategory = categories.find(c => c.id === modelCategoryId);
  const isScaleCategory = activeSelectedCategory?.inspection_type === 'SCALE' || 
    activeSelectedCategory?.slug?.includes('cartucho') || 
    activeSelectedCategory?.slug?.includes('toner');

  // ==========================================
  // MODEL HANDLERS
  // ==========================================
  const handleOpenAddModel = () => {
    setEditingModelId(null);
    setModelName('');
    setModelBrandId(brands[0]?.id || '');
    setModelCategoryId(categories[0]?.id || '');
    setModelInternalCode('');
    setModelBarcode('');
    setModelDesc('');
    setModelColor('');
    setModelIsXl(false);
    setModelCapacityMl('');
    setModelEmptyWeight('');
    setModelFullWeight('');
    setModelVoltage('Bivolt');
    setModelPowerSpecs('');
    setModelHardwareSpecs('');
    setModelRecommendedAccessories('');
    setModelServicePrices({});
    setShowModelModal(true);
  };

  const handleOpenEditModel = (model: ItemModel) => {
    setEditingModelId(model.id);
    setModelName(model.name || '');
    setModelBrandId(model.brand_id || '');
    setModelCategoryId(model.category_id || '');
    setModelInternalCode(model.internal_code || '');
    setModelBarcode(model.barcode || '');
    setModelDesc(model.description || '');
    setModelColor(model.color || '');
    setModelIsXl(Boolean(model.is_xl));
    setModelCapacityMl(model.capacity_ml ? String(model.capacity_ml) : '');
    setModelEmptyWeight(model.empty_weight_grams ? String(model.empty_weight_grams) : '');
    setModelFullWeight(model.full_weight_grams ? String(model.full_weight_grams) : '');
    setModelVoltage(model.voltage || 'Bivolt');
    setModelPowerSpecs(model.power_specs || '');
    setModelHardwareSpecs(model.hardware_specs || '');
    setModelRecommendedAccessories(model.recommended_accessories || '');
    
    // Map service prices
    const pricesObj: Record<string, string> = {};
    if (model.service_prices) {
      Object.entries(model.service_prices).forEach(([srvId, price]) => {
        pricesObj[srvId] = String(price);
      });
    }
    setModelServicePrices(pricesObj);
    setShowModelModal(true);
  };

  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim()) {
      showToast('Informe o nome do modelo/equipamento.', 'error');
      return;
    }

    const brandObj = brands.find(b => b.id === modelBrandId);
    
    // Build numeric service price overrides
    const numericServicePrices: Record<string, number> = {};
    Object.entries(modelServicePrices).forEach(([srvId, priceStr]) => {
      const p = parseFloat(priceStr);
      if (!isNaN(p) && p > 0) {
        numericServicePrices[srvId] = p;
      }
    });

    const payload: Partial<ItemModel> = {
      tenant_id: currentCompany.id,
      name: modelName.trim(),
      brand_id: modelBrandId || undefined,
      brand_name: brandObj?.name || '',
      category_id: modelCategoryId,
      internal_code: modelInternalCode.trim().toUpperCase() || undefined,
      barcode: modelBarcode.trim() || undefined,
      description: modelDesc.trim() || undefined,
      color: modelColor.trim() || undefined,
      is_xl: modelIsXl,
      capacity_ml: modelCapacityMl ? parseFloat(modelCapacityMl) : undefined,
      empty_weight_grams: modelEmptyWeight ? parseFloat(modelEmptyWeight) : undefined,
      full_weight_grams: modelFullWeight ? parseFloat(modelFullWeight) : undefined,
      voltage: modelVoltage || undefined,
      power_specs: modelPowerSpecs.trim() || undefined,
      hardware_specs: modelHardwareSpecs.trim() || undefined,
      recommended_accessories: modelRecommendedAccessories.trim() || undefined,
      service_prices: Object.keys(numericServicePrices).length > 0 ? numericServicePrices : undefined,
      is_active: true
    };

    try {
      if (editingModelId) {
        AppStore.updateModel(editingModelId, payload, currentUser.full_name);
        showToast(`Modelo "${modelName}" atualizado com sucesso!`);
      } else {
        AppStore.addModel(payload as any, currentUser.full_name);
        showToast(`Modelo "${modelName}" cadastrado com sucesso!`);
      }
      setShowModelModal(false);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar modelo.', 'error');
    }
  };

  const handleDeleteModel = (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o modelo "${name}"?`)) return;
    try {
      AppStore.deleteModel(id, currentUser.full_name);
      showToast(`Modelo "${name}" excluído.`);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao excluir modelo.', 'error');
    }
  };

  // ==========================================
  // SERVICE HANDLERS
  // ==========================================
  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServiceCode('');
    setServiceDesc('');
    setServicePrice('40.00');
    setServiceEstTime('45');
    setSelectedServiceCategories(categories.map(c => c.id));
    setShowServiceModal(true);
  };

  const handleOpenEditService = (srv: Service) => {
    setEditingServiceId(srv.id);
    setServiceName(srv.name);
    setServiceCode(srv.code);
    setServiceDesc(srv.description || '');
    setServicePrice(String(srv.default_price || '0.00'));
    setServiceEstTime(String(srv.estimated_time_minutes || '30'));
    setSelectedServiceCategories(srv.category_ids || categories.map(c => c.id));
    setShowServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      showToast('Informe o nome do serviço.', 'error');
      return;
    }

    const payload: Partial<Service> = {
      tenant_id: currentCompany.id,
      name: serviceName.trim(),
      code: (serviceCode || serviceName.toUpperCase().replace(/\s+/g, '_')).trim(),
      description: serviceDesc.trim() || undefined,
      default_price: parseFloat(servicePrice) || 0,
      estimated_time_minutes: parseInt(serviceEstTime, 10) || 30,
      category_ids: selectedServiceCategories,
      is_active: true
    };

    try {
      if (editingServiceId) {
        AppStore.updateService(editingServiceId, payload, currentUser.full_name);
        showToast(`Serviço "${serviceName}" atualizado com sucesso!`);
      } else {
        AppStore.addService(payload as any, currentUser.full_name);
        showToast(`Serviço "${serviceName}" cadastrado com sucesso!`);
      }
      setShowServiceModal(false);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar serviço.', 'error');
    }
  };

  const handleDeleteService = (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o serviço "${name}"?`)) return;
    try {
      AppStore.deleteService(id, currentUser.full_name);
      showToast(`Serviço "${name}" excluído.`);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao excluir serviço.', 'error');
    }
  };

  const toggleServiceCategory = (catId: string) => {
    if (selectedServiceCategories.includes(catId)) {
      setSelectedServiceCategories(selectedServiceCategories.filter(id => id !== catId));
    } else {
      setSelectedServiceCategories([...selectedServiceCategories, catId]);
    }
  };

  // ==========================================
  // CATEGORY HANDLERS & CHECKLIST
  // ==========================================
  const handleOpenAddCategory = () => {
    setEditingCategoryId(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatIdentifierLabel('Nº de Série');
    setCatInspectionType('CHECKLIST');
    setCatIcon('Laptop');
    setCatChecklistItems([
      'Liga normalmente e dá vídeo',
      'Sem riscos ou trincas na carcaça',
      'Acompanha Carregador / Fonte Original'
    ]);
    setNewChecklistInput('');
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: ItemCategory) => {
    setEditingCategoryId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description || '');
    setCatIdentifierLabel(cat.identifier_label || 'Nº de Série');
    setCatInspectionType(cat.inspection_type || 'CHECKLIST');
    setCatIcon(cat.icon || 'Laptop');
    setCatChecklistItems(cat.checklist_items || []);
    setNewChecklistInput('');
    setShowCategoryModal(true);
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistInput.trim()) return;
    setCatChecklistItems([...catChecklistItems, newChecklistInput.trim()]);
    setNewChecklistInput('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setCatChecklistItems(catChecklistItems.filter((_, i) => i !== index));
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
      checklist_items: catChecklistItems,
      icon: catIcon,
      is_active: true
    };

    try {
      if (editingCategoryId) {
        AppStore.updateCategory(editingCategoryId, payload, currentUser.full_name);
        showToast(`Categoria "${catName}" atualizada com sucesso!`);
      } else {
        AppStore.addCategory(payload as any, currentUser.full_name);
        showToast(`Categoria "${catName}" cadastrada com sucesso!`);
      }
      setShowCategoryModal(false);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar categoria.', 'error');
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    const linkedModels = models.filter(m => m.category_id === id);
    if (linkedModels.length > 0) {
      alert(`Não é possível excluir a categoria "${name}" pois existem ${linkedModels.length} modelo(s) cadastrado(s) nela. Realoque os modelos primeiro.`);
      return;
    }
    if (!confirm(`Deseja realmente excluir a categoria "${name}"?`)) return;
    try {
      AppStore.deleteCategory(id, currentUser.full_name);
      showToast(`Categoria "${name}" excluída.`);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao excluir categoria.', 'error');
    }
  };

  // ==========================================
  // BRAND HANDLERS
  // ==========================================
  const handleOpenAddBrand = () => {
    setEditingBrandId(null);
    setBrandName('');
    setBrandSlug('');
    setShowBrandModal(true);
  };

  const handleOpenEditBrand = (b: Brand) => {
    setEditingBrandId(b.id);
    setBrandName(b.name);
    setBrandSlug(b.slug);
    setShowBrandModal(true);
  };

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      showToast('Informe o nome da marca.', 'error');
      return;
    }

    const payload: Partial<Brand> = {
      tenant_id: currentCompany.id,
      name: brandName.trim(),
      slug: brandSlug.trim() || brandName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
      is_active: true
    };

    try {
      if (editingBrandId) {
        AppStore.updateBrand(editingBrandId, payload, currentUser.full_name);
        showToast(`Marca "${brandName}" atualizada com sucesso!`);
      } else {
        AppStore.addBrand(payload as any, currentUser.full_name);
        showToast(`Marca "${brandName}" cadastrada com sucesso!`);
      }
      setShowBrandModal(false);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar marca.', 'error');
    }
  };

  const handleDeleteBrand = (id: string, name: string) => {
    const linkedModels = models.filter(m => m.brand_id === id);
    if (linkedModels.length > 0) {
      alert(`Não é possível excluir a marca "${name}" pois existem ${linkedModels.length} modelo(s) cadastrado(s) nela. Realoque os modelos primeiro.`);
      return;
    }
    if (!confirm(`Deseja realmente excluir a marca "${name}"?`)) return;
    try {
      AppStore.deleteBrand(id, currentUser.full_name);
      showToast(`Marca "${name}" excluída.`);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao excluir marca.', 'error');
    }
  };

  // ==========================================
  // WORKFLOW STATES HANDLERS
  // ==========================================
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
        AppStore.updateWorkflowState(editingStateId, payload, currentUser.full_name);
        showToast(`Etapa "${stateName}" atualizada com sucesso!`);
      } else {
        AppStore.addWorkflowState(currentCompany.id, payload as any, currentUser.full_name);
        showToast(`Etapa "${stateName}" adicionada ao Kanban!`);
      }
      setShowStateModal(false);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar etapa.', 'error');
    }
  };

  const handleDeleteState = (id: string, name: string) => {
    if (workflowStates.length <= 2) {
      alert('O Kanban precisa ter pelo menos 2 etapas operacionais.');
      return;
    }
    if (!confirm(`Deseja realmente remover a coluna "${name}" do Kanban?`)) return;
    try {
      AppStore.deleteWorkflowState(id, currentUser.full_name);
      showToast(`Etapa "${name}" removida.`);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao excluir etapa.', 'error');
    }
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

  // Filtered Lists
  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const matchSearch = (
        m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (m.internal_code && m.internal_code.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (m.brand_name && m.brand_name.toLowerCase().includes(searchFilter.toLowerCase()))
      );
      const matchCategory = categoryFilter === 'ALL' || m.category_id === categoryFilter;
      const matchBrand = brandFilter === 'ALL' || m.brand_id === brandFilter;
      return matchSearch && matchCategory && matchBrand;
    });
  }, [models, searchFilter, categoryFilter, brandFilter]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchSearch = (
        s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.code.toLowerCase().includes(searchFilter.toLowerCase())
      );
      const matchCategory = categoryFilter === 'ALL' || (s.category_ids && s.category_ids.includes(categoryFilter));
      return matchSearch && matchCategory;
    });
  }, [services, searchFilter, categoryFilter]);

  // Available services for currently editing model's category
  const servicesForCurrentModelCategory = useMemo(() => {
    if (!modelCategoryId) return services;
    return services.filter(s => !s.category_ids || s.category_ids.length === 0 || s.category_ids.includes(modelCategoryId));
  }, [services, modelCategoryId]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold animate-in fade-in slide-in-from-bottom-5",
          notification.type === 'success' ? "bg-emerald-600 text-white border-emerald-500" : "bg-rose-600 text-white border-rose-500"
        )}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Catálogo & Engenharia de Serviços
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize equipamentos, categorias, marcas, serviços e as etapas do fluxo Kanban da bancada técnica.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Button */}
        {canManage && (
          <div className="flex items-center gap-2">
            {activeTab === 'MODELS' && (
              <Button onClick={handleOpenAddModel} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20">
                <PlusCircle className="w-4 h-4" />
                Novo Modelo
              </Button>
            )}
            {activeTab === 'SERVICES' && (
              <Button onClick={handleOpenAddService} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20">
                <PlusCircle className="w-4 h-4" />
                Novo Serviço
              </Button>
            )}
            {activeTab === 'CATEGORIES' && (
              <Button onClick={handleOpenAddCategory} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20">
                <PlusCircle className="w-4 h-4" />
                Nova Categoria
              </Button>
            )}
            {activeTab === 'BRANDS' && (
              <Button onClick={handleOpenAddBrand} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20">
                <PlusCircle className="w-4 h-4" />
                Nova Marca
              </Button>
            )}
            {activeTab === 'WORKFLOW' && (
              <Button onClick={handleOpenAddState} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20">
                <PlusCircle className="w-4 h-4" />
                Nova Etapa do Kanban
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('MODELS')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'MODELS'
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <Tag className="w-4 h-4" />
          <span>Modelos & Produtos</span>
          <Badge className={cn("text-[10px] ml-1", activeTab === 'MODELS' ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
            {models.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('SERVICES')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'SERVICES'
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <Wrench className="w-4 h-4" />
          <span>Tabela de Serviços & Preços</span>
          <Badge className={cn("text-[10px] ml-1", activeTab === 'SERVICES' ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
            {services.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'CATEGORIES'
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Categorias & Checklists</span>
          <Badge className={cn("text-[10px] ml-1", activeTab === 'CATEGORIES' ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
            {categories.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('BRANDS')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'BRANDS'
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <Building className="w-4 h-4" />
          <span>Marcas & Fabricantes</span>
          <Badge className={cn("text-[10px] ml-1", activeTab === 'BRANDS' ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
            {brands.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('WORKFLOW')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'WORKFLOW'
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <Kanban className="w-4 h-4" />
          <span>Etapas do Kanban (Situações)</span>
          <Badge className={cn("text-[10px] ml-1", activeTab === 'WORKFLOW' ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
            {workflowStates.length}
          </Badge>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MODELOS & EQUIPAMENTOS */}
      {/* ========================================================================= */}
      {activeTab === 'MODELS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Buscar por nome, código ou modelo..."
                className="pl-9 text-xs"
              />
            </div>

            <Select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs"
            >
              <option value="ALL">Todas as Categorias ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>

            <Select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="text-xs"
            >
              <option value="ALL">Todas as Marcas ({brands.length})</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>

          {/* Models Grid */}
          {filteredModels.length === 0 ? (
            <Card className="bg-white dark:bg-slate-900 border-dashed border-2 text-center py-12">
              <CardContent className="space-y-3">
                <Tag className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum modelo encontrado</p>
                <p className="text-xs text-slate-400">Tente ajustar seus filtros ou cadastre um novo modelo.</p>
                {canManage && (
                  <Button onClick={handleOpenAddModel} className="bg-emerald-600 text-white text-xs font-bold mt-2">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Cadastrar Primeiro Modelo
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map(model => {
                const cat = categories.find(c => c.id === model.category_id);
                const br = brands.find(b => b.id === model.brand_id);
                const hasCustomPrices = model.service_prices && Object.keys(model.service_prices).length > 0;

                return (
                  <Card key={model.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all shadow-sm group">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {cat && (
                              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none text-[10px]">
                                {cat.name}
                              </Badge>
                            )}
                            {br && (
                              <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px]">
                                {br.name}
                              </Badge>
                            )}
                            {model.is_xl && (
                              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                                XL / Alta Cap.
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {model.name}
                          </CardTitle>
                          {model.internal_code && (
                            <p className="text-[11px] text-slate-400 font-mono">Cód: {model.internal_code}</p>
                          )}
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditModel(model)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Editar Modelo"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(model.id, model.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Excluir Modelo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-3">
                      {model.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {model.description}
                        </p>
                      )}

                      {/* Technical Specs Tags */}
                      <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                        {model.color && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                            🎨 Cor: {model.color}
                          </span>
                        )}
                        {model.capacity_ml && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                            💧 Cap: {model.capacity_ml}ml
                          </span>
                        )}
                        {model.empty_weight_grams && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                            ⚖️ Tara: {model.empty_weight_grams}g
                          </span>
                        )}
                        {model.full_weight_grams && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                            ⚖️ Cheio: {model.full_weight_grams}g
                          </span>
                        )}
                        {model.voltage && model.voltage !== 'Bivolt' && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                            ⚡ {model.voltage}
                          </span>
                        )}
                        {model.hardware_specs && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                            💻 {model.hardware_specs}
                          </span>
                        )}
                      </div>

                      {/* Custom Price Overrides Indicator */}
                      {hasCustomPrices && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                            Preços Específicos:
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {Object.keys(model.service_prices!).length} serviço(s) customizados
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TABELA DE SERVIÇOS & PREÇOS */}
      {/* ========================================================================= */}
      {activeTab === 'SERVICES' && (
        <div className="space-y-4">
          {/* Services Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Buscar por serviço ou código..."
                className="pl-9 text-xs"
              />
            </div>

            <Select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs"
            >
              <option value="ALL">Todas as Categorias Aplicáveis</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          {/* Services List Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Serviço / Procedimento</th>
                    <th className="p-3.5">Código</th>
                    <th className="p-3.5">Categorias Vinculadas</th>
                    <th className="p-3.5">Tempo Médio</th>
                    <th className="p-3.5 text-right">Preço Padrão</th>
                    {canManage && <th className="p-3.5 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredServices.map(srv => {
                    const linkedCats = categories.filter(c => srv.category_ids?.includes(c.id));

                    return (
                      <tr key={srv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{srv.name}</div>
                          {srv.description && (
                            <div className="text-[11px] text-slate-400 mt-0.5 max-w-md">{srv.description}</div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                            {srv.code}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {linkedCats.length === 0 ? (
                              <span className="text-slate-400 text-[11px]">Todas as categorias</span>
                            ) : (
                              linkedCats.map(c => (
                                <Badge key={c.id} className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px]">
                                  {c.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {srv.estimated_time_minutes || 30} min
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrency(srv.default_price)}
                        </td>
                        {canManage && (
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditService(srv)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                title="Editar Serviço"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteService(srv.id, srv.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Excluir Serviço"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CATEGORIAS & CHECKLISTS */}
      {/* ========================================================================= */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Segmentação & Tipos de Equipamentos
              </h2>
              <p className="text-xs text-slate-400">
                Configure as categorias atendidas e defina o checklist de conferência específico de cada uma.
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Editar Categoria"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
                      <div className="flex justify-between">
                        <span className="text-slate-400">Rótulo do Serial:</span>
                        <span className="font-semibold">{cat.identifier_label || 'Nº de Série'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tipo de Inspeção:</span>
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                          {cat.inspection_type === 'SCALE' ? '⚖️ Balança (g)' : cat.inspection_type === 'CHECKLIST' ? '📋 Checklist' : '🔧 Padrão'}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MARCAS & FABRICANTES */}
      {/* ========================================================================= */}
      {activeTab === 'BRANDS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Marcas & Fabricantes Parceiros
              </h2>
              <p className="text-xs text-slate-400">
                Cadastre e edite marcas de cartuchos, computadores, celulares e ferramentas (ex: HP, Epson, Dell, Apple, Makita).
              </p>
            </div>
            {canManage && (
              <Button onClick={handleOpenAddBrand} className="bg-emerald-600 text-white font-bold text-xs gap-1.5 shadow-sm">
                <PlusCircle className="w-4 h-4" />
                Nova Marca
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {brands.map(brand => {
              const modelCount = models.filter(m => m.brand_id === brand.id).length;

              return (
                <Card key={brand.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                          {brand.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                            {brand.name}
                          </CardTitle>
                          <p className="text-[10px] text-slate-400 font-mono">{brand.slug}</p>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleOpenEditBrand(brand)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Editar Marca"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBrand(brand.id, brand.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Excluir Marca"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Modelos Vinculados:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{modelCount}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ETAPAS DO KANBAN (SITUAÇÕES / WORKFLOW) */}
      {/* ========================================================================= */}
      {activeTab === 'WORKFLOW' && (
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR MODELO COM OPCIONAIS & PREÇOS DE SERVIÇO */}
      {/* ========================================================================= */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 my-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  {editingModelId ? 'Editar Modelo de Equipamento' : 'Cadastrar Novo Modelo de Equipamento'}
                </h3>
              </div>
              <button onClick={() => setShowModelModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Section 1: General Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">1. Dados Principais</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Nome do Modelo / Equipamento *
                    </label>
                    <Input
                      value={modelName}
                      onChange={e => setModelName(e.target.value)}
                      placeholder="Ex: HP 664, Dell Latitude 3470, iPhone 13 Pro..."
                      className="text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Categoria do Equipamento *
                    </label>
                    <Select
                      value={modelCategoryId}
                      onChange={e => setModelCategoryId(e.target.value)}
                      className="text-xs"
                      required
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Marca / Fabricante
                    </label>
                    <Select
                      value={modelBrandId}
                      onChange={e => setModelBrandId(e.target.value)}
                      className="text-xs"
                    >
                      <option value="">Sem Marca Definida</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Código Interno / SKU
                    </label>
                    <Input
                      value={modelInternalCode}
                      onChange={e => setModelInternalCode(e.target.value)}
                      placeholder="Ex: HP-664-BLK ou LAT3470"
                      className="text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Código de Barras / EAN
                    </label>
                    <Input
                      value={modelBarcode}
                      onChange={e => setModelBarcode(e.target.value)}
                      placeholder="Ex: 7891234567890"
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Descrição & Observações Técnicas
                    </label>
                    <Input
                      value={modelDesc}
                      onChange={e => setModelDesc(e.target.value)}
                      placeholder="Ex: Cartucho padrão preto 2ml ou Notebook Core i5 8ª Ger."
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Technical Optionals (Dynamic per Category) */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">2. Opcionais & Especificações Técnicas</h4>
                
                {isScaleCategory ? (
                  /* Cartridge / Fluid / Toner Specifics */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Cor / Tipo de Tinta
                      </label>
                      <Select
                        value={modelColor}
                        onChange={e => setModelColor(e.target.value)}
                        className="text-xs"
                      >
                        <option value="">Selecione...</option>
                        <option value="Preto">Preto (Black)</option>
                        <option value="Tricolor">Tricolor (Color)</option>
                        <option value="Ciano">Ciano (Cyan)</option>
                        <option value="Magenta">Magenta</option>
                        <option value="Amarelo">Amarelo (Yellow)</option>
                        <option value="Preto Fotográfico">Preto Fotográfico</option>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Tara / Peso Vazio (g)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={modelEmptyWeight}
                        onChange={e => setModelEmptyWeight(e.target.value)}
                        placeholder="Ex: 28.5"
                        className="text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Peso Cheio de Ref. (g)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={modelFullWeight}
                        onChange={e => setModelFullWeight(e.target.value)}
                        placeholder="Ex: 38.0"
                        className="text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Capacidade Estimada (ml)
                      </label>
                      <Input
                        type="number"
                        step="0.5"
                        value={modelCapacityMl}
                        onChange={e => setModelCapacityMl(e.target.value)}
                        placeholder="Ex: 2.0 ou 8.5"
                        className="text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-3 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={modelIsXl}
                          onChange={e => setModelIsXl(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>Versão XL (Alta Capacidade / Rendimento Extra)</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Electronics, Computers, Tools, Motors Specifics */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Voltagem / Alimentação
                      </label>
                      <Select
                        value={modelVoltage}
                        onChange={e => setModelVoltage(e.target.value)}
                        className="text-xs"
                      >
                        <option value="Bivolt">Bivolt Automático</option>
                        <option value="110V">110V / 127V</option>
                        <option value="220V">220V</option>
                        <option value="Trifásico 220V">Trifásico 220V</option>
                        <option value="Trifásico 380V">Trifásico 380V</option>
                        <option value="Bateria / Recarregável">Bateria / Recarregável</option>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Potência / Especificação Mecânica
                      </label>
                      <Input
                        value={modelPowerSpecs}
                        onChange={e => setModelPowerSpecs(e.target.value)}
                        placeholder="Ex: 650W, 12V 2Ah, 3.5 HP, 2800 RPM..."
                        className="text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Configuração de Hardware / Chips
                      </label>
                      <Input
                        value={modelHardwareSpecs}
                        onChange={e => setModelHardwareSpecs(e.target.value)}
                        placeholder="Ex: Intel Core i5 11ª Ger, 16GB RAM, SSD 512GB..."
                        className="text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Acessórios Padrão Recomendados
                      </label>
                      <Input
                        value={modelRecommendedAccessories}
                        onChange={e => setModelRecommendedAccessories(e.target.value)}
                        placeholder="Ex: Acompanha Fonte Original 65W, Cabo de Força..."
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Custom Service Price Overrides for this Model */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                      3. Tabela de Preços de Serviços para este Modelo
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Deixe em branco para usar o preço padrão do serviço ou defina um valor específico para este modelo.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  {servicesForCurrentModelCategory.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">
                      Nenhum serviço vinculado a esta categoria.
                    </p>
                  ) : (
                    servicesForCurrentModelCategory.map(srv => {
                      const currentVal = modelServicePrices[srv.id] || '';
                      
                      return (
                        <div key={srv.id} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div>
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{srv.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Preço Padrão: <span className="font-semibold text-slate-600 dark:text-slate-300">{formatCurrency(srv.default_price)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 w-32">
                            <span className="text-xs text-slate-400 font-bold">R$</span>
                            <Input
                              type="number"
                              step="0.50"
                              value={currentVal}
                              onChange={e => {
                                setModelServicePrices({
                                  ...modelServicePrices,
                                  [srv.id]: e.target.value
                                });
                              }}
                              placeholder={String(srv.default_price.toFixed(2))}
                              className="text-xs font-bold font-mono text-right h-8"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowModelModal(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
                  <Check className="w-4 h-4" />
                  {editingModelId ? 'Salvar Alterações' : 'Cadastrar Modelo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR SERVIÇO & LINCAGEM COM CATEGORIAS */}
      {/* ========================================================================= */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 my-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  {editingServiceId ? 'Editar Serviço / Procedimento' : 'Novo Serviço / Procedimento'}
                </h3>
              </div>
              <button onClick={() => setShowServiceModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Serviço *
                </label>
                <Input
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  placeholder="Ex: Recarga de Tinta, Formatação, Troca de Conector..."
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Código Mnemônico
                  </label>
                  <Input
                    value={serviceCode}
                    onChange={e => setServiceCode(e.target.value)}
                    placeholder="Ex: RECARGA_TINTA"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tempo Médio (min)
                  </label>
                  <Input
                    type="number"
                    value={serviceEstTime}
                    onChange={e => setServiceEstTime(e.target.value)}
                    placeholder="Ex: 30"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Preço Padrão de Venda (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <Input
                    type="number"
                    step="0.50"
                    value={servicePrice}
                    onChange={e => setServicePrice(e.target.value)}
                    placeholder="50.00"
                    className="pl-9 text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição do Procedimento
                </label>
                <Input
                  value={serviceDesc}
                  onChange={e => setServiceDesc(e.target.value)}
                  placeholder="Ex: Injeção pressurizada de tinta, desobstrução ultrassônica..."
                  className="text-xs"
                />
              </div>

              {/* Category Linking */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Disponível nas seguintes Categorias:
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedServiceCategories(categories.map(c => c.id))}
                      className="text-[10px] text-emerald-600 hover:underline font-bold"
                    >
                      Marcar Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedServiceCategories([])}
                      className="text-[10px] text-slate-400 hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 max-h-40 overflow-y-auto">
                  {categories.map(cat => {
                    const isChecked = selectedServiceCategories.includes(cat.id);

                    return (
                      <label
                        key={cat.id}
                        onClick={() => toggleServiceCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all",
                          isChecked
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 text-emerald-600 rounded pointer-events-none"
                        />
                        <span className="truncate">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowServiceModal(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
                  <Check className="w-4 h-4" />
                  {editingServiceId ? 'Salvar Serviço' : 'Cadastrar Serviço'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR CATEGORIA & CHECKLIST INTEGRADO */}
      {/* ========================================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 my-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  {editingCategoryId ? 'Editar Categoria & Checklist' : 'Nova Categoria de Equipamentos'}
                </h3>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Categoria *
                </label>
                <Input
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  placeholder="Ex: Smartphones & Celulares, Motores Elétricos..."
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Rótulo do Serial / Código
                  </label>
                  <Input
                    value={catIdentifierLabel}
                    onChange={e => setCatIdentifierLabel(e.target.value)}
                    placeholder="Ex: IMEI / Serial, Nº de Série..."
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tipo de Inspeção
                  </label>
                  <Select
                    value={catInspectionType}
                    onChange={e => setCatInspectionType(e.target.value as any)}
                    className="text-xs"
                  >
                    <option value="CHECKLIST">📋 Checklist Físico</option>
                    <option value="SCALE">⚖️ Balança (g)</option>
                    <option value="STANDARD">🔧 Padrão / Sintomas</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição Breve
                </label>
                <Input
                  value={catDesc}
                  onChange={e => setCatDesc(e.target.value)}
                  placeholder="Ex: Manutenção e reparos em celulares e tablets..."
                  className="text-xs"
                />
              </div>

              {/* Interactive Checklist Editor */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Checklist de Conferência desta Categoria</span>
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
                    className="text-xs"
                  />
                  <Button type="button" onClick={handleAddChecklistItem} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shrink-0">
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
                <Button type="button" variant="outline" onClick={() => setShowCategoryModal(false)} className="text-xs">
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

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR MARCA */}
      {/* ========================================================================= */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 my-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  {editingBrandId ? 'Editar Marca' : 'Nova Marca / Fabricante'}
                </h3>
              </div>
              <button onClick={() => setShowBrandModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Marca / Fabricante *
                </label>
                <Input
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="Ex: Apple, HP, Dell, Makita, Bosch..."
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Slug / Identificador URL (opcional)
                </label>
                <Input
                  value={brandSlug}
                  onChange={e => setBrandSlug(e.target.value)}
                  placeholder="Ex: apple, dell, hp"
                  className="text-xs font-mono"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowBrandModal(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
                  <Check className="w-4 h-4" />
                  {editingBrandId ? 'Salvar Marca' : 'Cadastrar Marca'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR ETAPA DO KANBAN (WORKFLOW STATE) */}
      {/* ========================================================================= */}
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
              <button onClick={() => setShowStateModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveState} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Etapa / Situação *
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
                <Button type="button" variant="outline" onClick={() => setShowStateModal(false)} className="text-xs">
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
