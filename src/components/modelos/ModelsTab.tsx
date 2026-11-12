'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Tag, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  DollarSign, 
  X, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { ItemModel, ItemCategory, Brand, Service, Company, Profile } from '@/types';
import { AppStore } from '@/lib/store';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface ModelsTabProps {
  models: ItemModel[];
  categories: ItemCategory[];
  brands: Brand[];
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

export function ModelsTab({
  models,
  categories,
  brands,
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
}: ModelsTabProps) {
  const [showModelModal, setShowModelModal] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelBrandId, setModelBrandId] = useState('');
  const [modelCategoryId, setModelCategoryId] = useState('');
  const [modelInternalCode, setModelInternalCode] = useState('');
  const [modelBarcode, setModelBarcode] = useState('');
  const [modelDesc, setModelDesc] = useState('');
  
  // Custom Dynamic Attributes for Model
  const [modelCustomAttributes, setModelCustomAttributes] = useState<Record<string, any>>({});
  
  // Scale / Cartridge specific weights
  const [modelEmptyWeight, setModelEmptyWeight] = useState('');
  const [modelFullWeight, setModelFullWeight] = useState('');
  
  // Custom service price overrides for this specific model
  const [modelServicePrices, setModelServicePrices] = useState<Record<string, string>>({});

  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');

  const handleCloseModal = () => {
    setShowModelModal(false);
    if (onCloseCreate) onCloseCreate();
  };

  const handleOpenAddModel = () => {
    setEditingModelId(null);
    setModelName('');
    setModelBrandId(brands[0]?.id || '');
    setModelCategoryId(categories[0]?.id || '');
    
    // Auto-suggest internal code
    const autoSku = `MOD-${String(models.length + 1).padStart(4, '0')}`;
    setModelInternalCode(autoSku);
    setModelBarcode('');
    setModelDesc('');
    setModelCustomAttributes({});
    setModelEmptyWeight('');
    setModelFullWeight('');
    setModelServicePrices({});
    setShowModelModal(true);
  };

  useEffect(() => {
    if (isCreateOpen) {
      handleOpenAddModel();
    }
  }, [isCreateOpen]);

  const handleOpenEditModel = (model: ItemModel) => {
    setEditingModelId(model.id);
    setModelName(model.name || '');
    setModelBrandId(model.brand_id || '');
    setModelCategoryId(model.category_id || '');
    setModelInternalCode(model.internal_code || '');
    setModelBarcode(model.barcode || '');
    setModelDesc(model.description || '');
    
    // Merge existing attributes
    const mergedAttrs: Record<string, any> = {
      ...(model.custom_attributes || {}),
      ...(model.attributes || {})
    };
    if (model.color) mergedAttrs['Cor'] = model.color;
    if (model.voltage) mergedAttrs['Voltagem'] = model.voltage;
    if (model.power_specs) mergedAttrs['Potência'] = model.power_specs;
    if (model.hardware_specs) mergedAttrs['Hardware'] = model.hardware_specs;
    if (model.recommended_accessories) mergedAttrs['Acessórios'] = model.recommended_accessories;

    setModelCustomAttributes(mergedAttrs);
    setModelEmptyWeight(model.empty_weight_grams ? String(model.empty_weight_grams) : '');
    setModelFullWeight(model.full_weight_grams ? String(model.full_weight_grams) : '');
    
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

  const handleRequestCloseModelModal = () => {
    const isDirty = Boolean(
      modelName.trim() ||
      modelInternalCode.trim() ||
      modelBarcode.trim() ||
      modelDesc.trim() ||
      Object.keys(modelCustomAttributes).length > 0 ||
      modelEmptyWeight ||
      modelFullWeight ||
      Object.keys(modelServicePrices).length > 0
    );

    if (isDirty) {
      showConfirm({
        title: 'Descartar Alterações do Modelo?',
        subtitle: 'Alterações não salvas serão perdidas.',
        message: 'Você possui dados preenchidos ou modificados neste formulário. Tem certeza de que deseja sair sem salvar?',
        confirmLabel: 'Sim, Descartar e Sair',
        cancelLabel: 'Continuar Editando',
        type: 'danger',
        onConfirm: handleCloseModal
      });
    } else {
      handleCloseModal();
    }
  };

  const handleAutoComposeDescription = () => {
    if (!modelName.trim()) return;
    const cat = categories.find(c => c.id === modelCategoryId);
    const parts: string[] = [modelName.trim()];

    if (cat?.custom_fields) {
      cat.custom_fields.forEach(f => {
        if (f.include_in_description && modelCustomAttributes[f.name] !== undefined && modelCustomAttributes[f.name] !== '' && modelCustomAttributes[f.name] !== null) {
          const val = modelCustomAttributes[f.name];
          if (typeof val === 'boolean') {
            if (val) parts.push(f.name);
          } else {
            parts.push(f.unit ? `${val}${f.unit}` : String(val));
          }
        }
      });
    }

    const fullDesc = parts.join(' ').replace(/\s+/g, ' ').trim();
    setModelDesc(fullDesc);
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
      custom_attributes: modelCustomAttributes,
      empty_weight_grams: modelEmptyWeight ? parseFloat(modelEmptyWeight) : undefined,
      full_weight_grams: modelFullWeight ? parseFloat(modelFullWeight) : undefined,
      service_prices: Object.keys(numericServicePrices).length > 0 ? numericServicePrices : undefined,
      is_active: true
    };

    try {
      if (editingModelId) {
        AppStore.updateModel(editingModelId, payload, currentUser?.full_name || 'Admin');
        showToast(`Modelo "${modelName}" atualizado com sucesso!`);
      } else {
        AppStore.addModel(payload as any, currentUser?.full_name || 'Admin');
        showToast(`Modelo "${modelName}" cadastrado com sucesso!`);
      }
      handleCloseModal();
      onRefresh();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar modelo.', 'error');
    }
  };

  const handleDeleteModel = (id: string, name: string) => {
    showConfirm({
      title: 'Excluir Modelo?',
      subtitle: 'Esta ação não poderá ser desfeita',
      message: `Deseja realmente excluir o modelo "${name}" do catálogo?`,
      confirmLabel: 'Sim, Excluir Modelo',
      type: 'danger',
      onConfirm: () => {
        try {
          AppStore.deleteModel(id, currentUser?.full_name || 'Admin');
          showToast(`Modelo "${name}" excluído.`);
          onRefresh();
        } catch (err: any) {
          showToast(err?.message || 'Erro ao excluir modelo.', 'error');
        }
      }
    });
  };

  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const matchesSearch = !searchFilter.trim() || 
        m.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
        (m.internal_code || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(searchFilter.toLowerCase());
      const matchesCat = categoryFilter === 'ALL' || m.category_id === categoryFilter;
      const matchesBrand = brandFilter === 'ALL' || m.brand_id === brandFilter;
      return matchesSearch && matchesCat && matchesBrand;
    });
  }, [models, searchFilter, categoryFilter, brandFilter]);

  const activeSelectedCategory = useMemo(() => {
    return categories.find(c => c.id === modelCategoryId);
  }, [categories, modelCategoryId]);

  const isScaleCategory = useMemo(() => {
    return Boolean(activeSelectedCategory?.inspection_type === 'SCALE' || activeSelectedCategory?.slug?.includes('cartucho') || activeSelectedCategory?.slug?.includes('toner'));
  }, [activeSelectedCategory]);

  const servicesForCurrentModelCategory = useMemo(() => {
    return services.filter(s => !s.category_ids || s.category_ids.length === 0 || s.category_ids.includes(modelCategoryId));
  }, [services, modelCategoryId]);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Buscar por descrição ou código interno..."
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
            const dynamicAttrs = model.custom_attributes || {};

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
                      </div>
                      <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {model.name}
                      </CardTitle>
                      {model.internal_code && (
                        <p className="text-[11px] text-slate-400 font-mono">Cód / SKU: {model.internal_code}</p>
                      )}
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModel(model)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition-colors"
                          title="Editar Modelo"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteModel(model.id, model.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition-colors"
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

                  {/* Technical Specs & Dynamic Attributes */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                    {Object.entries(dynamicAttrs).map(([k, v]) => {
                      if (v === undefined || v === '' || v === false) return null;
                      const fieldDef = cat?.custom_fields?.find(f => f.name === k);
                      const displayVal = typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : (fieldDef?.unit ? `${v}${fieldDef.unit}` : String(v));

                      return (
                        <span key={k} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                          {k}: <strong className="text-slate-800 dark:text-slate-200">{displayVal}</strong>
                        </span>
                      );
                    })}

                    {/* Weights if scale/cartridge */}
                    {model.empty_weight_grams && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium">
                        ⚖️ Tara: {model.empty_weight_grams}g
                      </span>
                    )}
                    {model.full_weight_grams && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium">
                        ⚖️ Cheio: {model.full_weight_grams}g
                      </span>
                    )}
                  </div>

                  {/* Custom Price Overrides Indicator */}
                  {hasCustomPrices && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        Preços Customizados:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {Object.keys(model.service_prices!).length} serviço(s)
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Model Modal */}
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
              <button onClick={handleRequestCloseModelModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Section 1: General Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">1. Dados Principais</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center mb-1">
                      <span>Categoria do Equipamento</span>
                      <span className="text-red-500 font-bold ml-1">*</span>
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

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center mb-1">
                      <span>Nome do Modelo / Descrição Principal</span>
                      <span className="text-red-500 font-bold ml-1">*</span>
                    </label>
                    <Input
                      value={modelName}
                      onChange={e => setModelName(e.target.value)}
                      placeholder="Ex: HP 664, Latitude 3470, iPhone 13 Pro, Furadeira HP1640..."
                      className="text-xs"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Código Interno / SKU
                      </label>
                    </div>
                    <Input
                      value={modelInternalCode}
                      onChange={e => setModelInternalCode(e.target.value)}
                      placeholder="Ex: MOD-0001 ou SKU-HP664"
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Descrição Completa do Produto
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoComposeDescription}
                        className="text-[10px] text-emerald-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Gerar da Especificação</span>
                      </button>
                    </div>
                    <Input
                      value={modelDesc}
                      onChange={e => setModelDesc(e.target.value)}
                      placeholder="Ex: HP 664 Tricolor Versão XL (Alta Capacidade) 32ml"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Dynamic Technical Specifications & Optionals */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                      2. Opcionais & Especificações ({activeSelectedCategory?.name || 'Categoria'})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Campos customizados configurados nesta categoria para este equipamento.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-4">
                  {/* Category Custom Fields */}
                  {activeSelectedCategory?.custom_fields && activeSelectedCategory.custom_fields.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeSelectedCategory.custom_fields.map(field => {
                        const currentVal = modelCustomAttributes[field.name];

                        if (field.type === 'checkbox') {
                          return (
                            <div key={field.id} className="sm:col-span-2">
                              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:border-emerald-500/40 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={Boolean(currentVal)}
                                  onChange={e => {
                                    setModelCustomAttributes({
                                      ...modelCustomAttributes,
                                      [field.name]: e.target.checked
                                    });
                                  }}
                                  className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {field.name}
                                </span>
                                {field.include_in_description && (
                                  <span className="text-[9px] text-emerald-600 font-normal ml-auto">(compõe descrição)</span>
                                )}
                              </label>
                            </div>
                          );
                        }

                        return (
                          <div key={field.id} className={field.type === 'text' ? 'sm:col-span-2' : ''}>
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              {field.name}
                              {field.unit && <span className="text-slate-400 ml-1">({field.unit})</span>}
                              {field.include_in_description && (
                                <span className="text-[9px] text-emerald-600 ml-1.5 font-normal">(compõe descrição)</span>
                              )}
                            </label>

                            {field.type === 'select' && field.options && field.options.length > 0 ? (
                              <Select
                                value={currentVal || ''}
                                onChange={e => {
                                  setModelCustomAttributes({
                                    ...modelCustomAttributes,
                                    [field.name]: e.target.value
                                  });
                                }}
                                className="text-xs"
                              >
                                <option value="">Selecione {field.name}...</option>
                                {field.options.map((opt, oIdx) => (
                                  <option key={oIdx} value={opt}>{opt}</option>
                                ))}
                              </Select>
                            ) : field.type === 'number' ? (
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={currentVal !== undefined ? currentVal : ''}
                                  onChange={e => {
                                    setModelCustomAttributes({
                                      ...modelCustomAttributes,
                                      [field.name]: e.target.value
                                    });
                                  }}
                                  placeholder={`Informe ${field.name}...`}
                                  className={cn("text-xs font-mono font-bold", field.unit ? "pr-12" : "")}
                                />
                                {field.unit && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                                    {field.unit}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Input
                                type="text"
                                value={currentVal || ''}
                                onChange={e => {
                                  setModelCustomAttributes({
                                    ...modelCustomAttributes,
                                    [field.name]: e.target.value
                                  });
                                }}
                                placeholder={`Informe ${field.name}...`}
                                className="text-xs"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-1">
                      Nenhuma especificação customizada para esta categoria. Você pode adicionar na aba <strong>Categorias & Especificações</strong>.
                    </p>
                  )}

                  {/* Cartridge Categories fixed weights */}
                  {isScaleCategory && (
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center mb-1">
                          <span>⚖️ Tara / Peso Vazio (g)</span>
                          <span className="text-red-500 font-bold ml-1">*</span>
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={modelEmptyWeight}
                          onChange={e => setModelEmptyWeight(e.target.value)}
                          placeholder="Ex: 28.5"
                          className="text-xs font-mono font-bold"
                        />
                        <span className="text-[10px] text-slate-400">Preenchimento fixo para cartuchos e fluidos</span>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          ⚖️ Tara / Peso Cheio de Referência (g)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={modelFullWeight}
                          onChange={e => setModelFullWeight(e.target.value)}
                          placeholder="Ex: 38.0"
                          className="text-xs font-mono font-bold"
                        />
                        <span className="text-[10px] text-slate-400">Referência de peso líquido 100% carregado</span>
                      </div>
                    </div>
                  )}
                </div>
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
                <Button type="button" variant="outline" onClick={handleRequestCloseModelModal} className="text-xs">
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
    </div>
  );
}
