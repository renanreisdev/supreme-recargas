'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Search, 
  PlusCircle, 
  Settings2, 
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
  Building
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { ItemModel, ItemCategory, Brand, Service } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function CatalogAndModelsPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'MODELS' | 'SERVICES' | 'CATEGORIES' | 'BRANDS'>('MODELS');
  
  const [models, setModels] = useState<ItemModel[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Model Modal
  const [showModelModal, setShowModelModal] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelBrandId, setModelBrandId] = useState('');
  const [modelCategoryId, setModelCategoryId] = useState('');
  const [modelInternalCode, setModelInternalCode] = useState('');
  const [modelDesc, setModelDesc] = useState('');

  // Service Modal
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('50.00');
  const [serviceEstTime, setServiceEstTime] = useState('45');
  const [selectedServiceCategories, setSelectedServiceCategories] = useState<string[]>([]);

  const canManage = hasPermission('manage_models') || hasPermission('catalog_manage') || currentUser?.role === 'ADMINISTRADOR';

  const loadData = () => {
    const mods = AppStore.getModels(currentCompany.id);
    const cats = AppStore.getCategories(currentCompany.id);
    const brs = AppStore.getBrands(currentCompany.id);
    const srvs = AppStore.getServices(currentCompany.id);

    setModels(mods);
    setCategories(cats);
    setBrands(brs);
    setServices(srvs);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  // Open Add Model Modal
  const handleOpenAddModel = () => {
    setEditingModelId(null);
    setModelName('');
    setModelBrandId(brands[0]?.id || '');
    setModelCategoryId(categories[0]?.id || '');
    setModelInternalCode('');
    setModelDesc('');
    setShowModelModal(true);
  };

  // Open Edit Model Modal
  const handleOpenEditModel = (model: ItemModel) => {
    setEditingModelId(model.id);
    setModelName(model.name || (model as any).model_name || '');
    setModelBrandId(model.brand_id || '');
    setModelCategoryId(model.category_id || '');
    setModelInternalCode(model.internal_code || '');
    setModelDesc(model.description || '');
    setShowModelModal(true);
  };

  // Save Model
  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName) return;

    const brandObj = brands.find(b => b.id === modelBrandId);

    if (editingModelId) {
      AppStore.updateModel(editingModelId, {
        name: modelName.trim(),
        brand_id: modelBrandId,
        brand_name: brandObj?.name || '',
        category_id: modelCategoryId,
        internal_code: modelInternalCode.trim().toUpperCase(),
        description: modelDesc
      }, currentUser.full_name);
    } else {
      AppStore.addModel({
        tenant_id: currentCompany.id,
        name: modelName.trim(),
        brand_id: modelBrandId,
        brand_name: brandObj?.name || '',
        category_id: modelCategoryId,
        internal_code: modelInternalCode.trim().toUpperCase(),
        description: modelDesc,
        is_active: true
      }, currentUser.full_name);
    }

    setShowModelModal(false);
  };

  // Open Add Service
  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServiceCode('');
    setServiceDesc('');
    setServicePrice('50.00');
    setServiceEstTime('45');
    setSelectedServiceCategories(categories.map(c => c.id));
    setShowServiceModal(true);
  };

  // Open Edit Service
  const handleOpenEditService = (srv: Service) => {
    setEditingServiceId(srv.id);
    setServiceName(srv.name);
    setServiceCode(srv.code);
    setServiceDesc(srv.description || '');
    setServicePrice(srv.default_price.toString());
    setServiceEstTime(srv.estimated_time_minutes?.toString() || '45');
    setSelectedServiceCategories(srv.category_ids || categories.map(c => c.id));
    setShowServiceModal(true);
  };

  // Save Service
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName) return;

    const code = serviceCode.trim().toUpperCase() || serviceName.trim().toUpperCase().replace(/\s+/g, '_');

    if (editingServiceId) {
      AppStore.updateService(editingServiceId, {
        name: serviceName.trim(),
        code,
        description: serviceDesc,
        default_price: parseFloat(servicePrice) || 0,
        estimated_time_minutes: parseInt(serviceEstTime) || 45,
        category_ids: selectedServiceCategories
      }, currentUser.full_name);
    } else {
      AppStore.addService({
        tenant_id: currentCompany.id,
        name: serviceName.trim(),
        code,
        description: serviceDesc,
        default_price: parseFloat(servicePrice) || 0,
        estimated_time_minutes: parseInt(serviceEstTime) || 45,
        category_ids: selectedServiceCategories,
        is_active: true
      }, currentUser.full_name);
    }

    setShowServiceModal(false);
  };

  // Filter Models
  const filteredModels = models.filter(m => {
    if (categoryFilter !== 'ALL' && m.category_id !== categoryFilter) return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase().trim();
    const name = (m.name || (m as any).model_name || '').toLowerCase();
    const brand = (m.brand_name || '').toLowerCase();
    const code = (m.internal_code || '').toLowerCase();
    return name.includes(q) || brand.includes(q) || code.includes(q);
  });

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <Tag className="w-5 h-5" />
            </span>
            Catálogo de Modelos & Serviços
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão modular de equipamentos, categorias, marcas e tabela de preços de serviços.
          </p>
        </div>

        {canManage && (
          <div className="flex gap-2">
            {activeTab === 'MODELS' && (
              <Button
                onClick={handleOpenAddModel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Novo Modelo</span>
              </Button>
            )}
            {activeTab === 'SERVICES' && (
              <Button
                onClick={handleOpenAddService}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Novo Serviço</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('MODELS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'MODELS'
              ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Modelos & Equipamentos ({models.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SERVICES')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'SERVICES'
              ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Tabela de Serviços ({services.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'CATEGORIES'
              ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Categorias ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BRANDS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'BRANDS'
              ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Marcas ({brands.length})</span>
        </button>
      </div>

      {/* Tab 1: Models & Equipment */}
      {activeTab === 'MODELS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="h-9 text-xs rounded-xl"
              >
                <option value="ALL">Todas as Categorias</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar modelo, marca ou código..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Marca / Fabricante</th>
                    <th className="py-3 px-4">Modelo do Equipamento</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Código Interno</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                  {filteredModels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Nenhum modelo cadastrado encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredModels.map(model => {
                      const cat = categories.find(c => c.id === model.category_id);
                      return (
                        <tr key={model.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {model.brand_name || 'Genérica'}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {model.name || (model as any).model_name}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {cat?.name || 'Geral'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            {model.internal_code || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                            {model.description || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {canManage && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditModel(model)}
                                className="h-8 text-xs rounded-xl px-2.5"
                              >
                                <Edit3 className="w-3.5 h-3.5 mr-1" />
                                <span>Editar</span>
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Services */}
      {activeTab === 'SERVICES' && (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Nome do Serviço</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Preço Padrão</th>
                  <th className="py-3 px-4">Tempo Estimado</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                {services.map(srv => (
                  <tr key={srv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {srv.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {srv.code}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(srv.default_price)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{srv.estimated_time_minutes || 60} min</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {srv.description || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canManage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditService(srv)}
                          className="h-8 text-xs rounded-xl px-2.5"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          <span>Editar</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Categories */}
      {activeTab === 'CATEGORIES' && (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Categorias Ativas da Plataforma
            </span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(cat => (
              <div key={cat.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{cat.name}</span>
                  <Badge className="bg-emerald-600 text-white text-[9px]">Ativa</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Identificador: <strong>{cat.identifier_label || 'Nº de Série'}</strong>
                </p>
                <p className="text-[11px] text-slate-400 font-mono">Slug: {cat.slug}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 4: Brands */}
      {activeTab === 'BRANDS' && (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Marcas e Fabricantes Cadastrados
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {brands.map(brand => (
              <div key={brand.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center space-y-1">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">{brand.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">slug: {brand.slug}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create / Edit Model Modal */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                {editingModelId ? 'Editar Modelo' : 'Novo Modelo / Equipamento'}
              </h3>
              <button type="button" onClick={() => setShowModelModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Categoria *
                </label>
                <Select
                  value={modelCategoryId}
                  onChange={e => setModelCategoryId(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Marca / Fabricante *
                </label>
                <Select
                  value={modelBrandId}
                  onChange={e => setModelBrandId(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                  required
                >
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Modelo *
                </label>
                <Input
                  required
                  placeholder="Ex: Latitude 3470, HP 664, iPhone 13..."
                  value={modelName}
                  onChange={e => setModelName(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Código Interno / SKU (Opcional)
                </label>
                <Input
                  placeholder="Ex: LAT3470, HP664"
                  value={modelInternalCode}
                  onChange={e => setModelInternalCode(e.target.value)}
                  className="h-9 text-xs rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição Técnica (Opcional)
                </label>
                <Input
                  placeholder="Ex: Notebook Corporativo 14 Polegadas..."
                  value={modelDesc}
                  onChange={e => setModelDesc(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModelModal(false)} className="rounded-xl text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">
                  Salvar Modelo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600" />
                {editingServiceId ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button type="button" onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Serviço *
                </label>
                <Input
                  required
                  placeholder="Ex: Formatação & Reinstalação de Sistema"
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Preço Padrão (R$) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={servicePrice}
                    onChange={e => setServicePrice(e.target.value)}
                    className="h-9 text-xs rounded-xl font-bold text-right"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tempo Est. (min)
                  </label>
                  <Input
                    type="number"
                    value={serviceEstTime}
                    onChange={e => setServiceEstTime(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição do Serviço
                </label>
                <Input
                  placeholder="Ex: Limpeza com álcool isopropílico e pasta condutiva..."
                  value={serviceDesc}
                  onChange={e => setServiceDesc(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowServiceModal(false)} className="rounded-xl text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">
                  Salvar Serviço
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
