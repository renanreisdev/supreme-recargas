'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Search, 
  PlusCircle, 
  Scale, 
  Tag, 
  Sparkles, 
  Settings2, 
  Check, 
  DollarSign, 
  Edit3, 
  Info,
  Sliders,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { CartridgeModel, CompanySettings, SegmentCustomization, ServicePrice } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wrench, Clock, Trash2, Power } from 'lucide-react';

export default function CartridgeModelsPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'MODELS' | 'SERVICES' | 'GLOBAL'>('MODELS');
  const [models, setModels] = useState<CartridgeModel[]>([]);
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));
  const [segmentConfig, setSegmentConfig] = useState<SegmentCustomization>(AppStore.getSegmentConfig(currentCompany.id));
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Create / Edit Model Modal
  const [showModal, setShowModal] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  // Form State - Models
  const [brandName, setBrandName] = useState('HP');
  const [modelName, setModelName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('Preto');
  const [isXl, setIsXl] = useState(false);
  const [capacityMl, setCapacityMl] = useState('');
  const [emptyWeight, setEmptyWeight] = useState('');
  const [fullWeight, setFullWeight] = useState('');
  const [refillPrice, setRefillPrice] = useState('30.00');
  const [verificationPrice, setVerificationPrice] = useState('15.00');
  const [testPrice, setTestPrice] = useState('10.00');
  const [techNotes, setTechNotes] = useState('');

  // Service Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('50.00');
  const [serviceEstTime, setServiceEstTime] = useState('45');

  // Global Settings Form State (Admin)
  const [globalRefill, setGlobalRefill] = useState(settings.default_refill_price || 30.00);
  const [globalRefillXl, setGlobalRefillXl] = useState(settings.default_refill_xl_price || 45.00);
  const [globalVerification, setGlobalVerification] = useState(settings.default_verification_price || 15.00);
  const [globalTest, setGlobalTest] = useState(settings.default_test_price || 10.00);
  const [inputWeightResponsibility, setInputWeightResponsibility] = useState<'ATENDENTE' | 'TECNICO' | 'AMBOS'>(settings.input_weight_responsibility || 'AMBOS');
  const [waiveVerification, setWaiveVerification] = useState(settings.waive_verification_if_refilled ?? true);
  const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);

  const loadData = () => {
    const mods = AppStore.getModels(currentCompany.id);
    const srvs = AppStore.getServices(currentCompany.id);
    const sets = AppStore.getSettings(currentCompany.id);
    const seg = AppStore.getSegmentConfig(currentCompany.id);
    setModels(mods);
    setServices(srvs);
    setSettings(sets);
    setSegmentConfig(seg);
    setGlobalRefill(sets.default_refill_price || 30.00);
    setGlobalRefillXl(sets.default_refill_xl_price || 45.00);
    setGlobalVerification(sets.default_verification_price || 15.00);
    setGlobalTest(sets.default_test_price || 10.00);
    setInputWeightResponsibility(sets.input_weight_responsibility || 'AMBOS');
    setWaiveVerification(sets.waive_verification_if_refilled ?? true);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  // Service Handlers
  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceTitle('');
    setServiceCategory(segmentConfig.defaultCategories[0] || 'Geral');
    setServiceDescription('');
    setServicePrice('50.00');
    setServiceEstTime('45');
    setShowServiceModal(true);
  };

  const handleOpenEditService = (srv: ServicePrice) => {
    setEditingServiceId(srv.id);
    setServiceTitle(srv.title);
    setServiceCategory(srv.category || 'Geral');
    setServiceDescription(srv.description || '');
    setServicePrice(srv.default_price.toString());
    setServiceEstTime(srv.estimated_time_minutes ? srv.estimated_time_minutes.toString() : '');
    setShowServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTitle) return;

    if (editingServiceId) {
      AppStore.updateService(editingServiceId, {
        title: serviceTitle,
        category: serviceCategory,
        description: serviceDescription,
        default_price: Number(servicePrice) || 0,
        estimated_time_minutes: serviceEstTime ? Number(serviceEstTime) : undefined
      }, currentUser?.full_name);
    } else {
      AppStore.addService(currentCompany.id, {
        title: serviceTitle,
        category: serviceCategory,
        description: serviceDescription,
        default_price: Number(servicePrice) || 0,
        estimated_time_minutes: serviceEstTime ? Number(serviceEstTime) : undefined,
        is_active: true
      }, currentUser?.full_name);
    }

    setShowServiceModal(false);
    loadData();
  };

  const handleToggleService = (srv: ServicePrice) => {
    AppStore.toggleServiceStatus(srv.id, currentUser?.full_name);
    loadData();
  };

  const handleDeleteService = (srv: ServicePrice) => {
    if (confirm(`Tem certeza que deseja excluir o serviço "${srv.title}"?`)) {
      AppStore.deleteService(srv.id, currentUser?.full_name);
      loadData();
    }
  };

  if (!currentUser) return null;

  const categoriesAvailable = Array.from(
    new Set([
      ...segmentConfig.defaultCategories,
      ...models.map(m => m.category).filter(Boolean) as string[]
    ])
  );

  const filtered = models.filter(m => {
    const matchesSearch = 
      m.model_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.brand_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (m.category && m.category.toLowerCase().includes(searchFilter.toLowerCase())) ||
      m.color.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Open Add Model
  const handleOpenAdd = () => {
    setEditingModelId(null);
    setBrandName(segmentConfig.segment === 'ASSISTENCIA_CELULARES_INFORMATICA' ? 'Apple' : segmentConfig.segment === 'FERRAMENTAS_MOTORES' ? 'Makita' : 'HP');
    setModelName('');
    setCategory(segmentConfig.defaultCategories[0] || '');
    setColor('Preto');
    setIsXl(false);
    setCapacityMl('');
    setEmptyWeight('');
    setFullWeight('');
    setRefillPrice(globalRefill.toString());
    setVerificationPrice(globalVerification.toString());
    setTestPrice(globalTest.toString());
    setTechNotes('');
    setShowModal(true);
  };

  // Open Edit Model
  const handleOpenEdit = (mod: CartridgeModel) => {
    setEditingModelId(mod.id);
    setBrandName(mod.brand_name || 'Geral');
    setModelName(mod.model_name);
    setCategory(mod.category || '');
    setColor(mod.color);
    setIsXl(mod.is_xl);
    setCapacityMl(mod.capacity_ml?.toString() || '');
    setEmptyWeight(mod.empty_weight_grams?.toString() || '');
    setFullWeight(mod.full_weight_grams?.toString() || '');
    setRefillPrice((mod.refill_price ?? (mod.is_xl ? globalRefillXl : globalRefill)).toString());
    setVerificationPrice((mod.verification_price ?? globalVerification).toString());
    setTestPrice((mod.test_price ?? globalTest).toString());
    setTechNotes(mod.technical_notes || '');
    setShowModal(true);
  };

  // Save Model
  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName) return;

    if (editingModelId) {
      AppStore.updateModel(editingModelId, {
        brand_name: brandName,
        model_name: modelName,
        category: category || undefined,
        color,
        is_xl: isXl,
        capacity_ml: capacityMl ? Number(capacityMl) : undefined,
        empty_weight_grams: emptyWeight ? Number(emptyWeight) : undefined,
        full_weight_grams: fullWeight ? Number(fullWeight) : undefined,
        refill_price: refillPrice ? Number(refillPrice) : undefined,
        verification_price: verificationPrice ? Number(verificationPrice) : undefined,
        test_price: testPrice ? Number(testPrice) : undefined,
        technical_notes: techNotes
      }, currentUser.full_name);
    } else {
      AppStore.addModel({
        tenant_id: currentCompany.id,
        brand_name: brandName,
        model_name: modelName,
        category: category || undefined,
        color,
        is_xl: isXl,
        capacity_ml: capacityMl ? Number(capacityMl) : undefined,
        empty_weight_grams: emptyWeight ? Number(emptyWeight) : undefined,
        full_weight_grams: fullWeight ? Number(fullWeight) : undefined,
        refill_price: refillPrice ? Number(refillPrice) : undefined,
        verification_price: verificationPrice ? Number(verificationPrice) : undefined,
        test_price: testPrice ? Number(testPrice) : undefined,
        technical_notes: techNotes,
        is_active: true
      }, currentUser.full_name);
    }

    loadData();
    setShowModal(false);
  };

  // Save Global Settings
  const handleSaveGlobalPricing = (e: React.FormEvent) => {
    e.preventDefault();
    AppStore.updateSettings(currentCompany.id, {
      default_refill_price: Number(globalRefill),
      default_refill_xl_price: Number(globalRefillXl),
      default_verification_price: Number(globalVerification),
      default_test_price: Number(globalTest),
      input_weight_responsibility: inputWeightResponsibility,
      waive_verification_if_refilled: waiveVerification
    }, currentUser.full_name);
    loadData();
    setSettingsSavedAlert(true);
    setTimeout(() => setSettingsSavedAlert(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600" />
            <span>Catálogo de Modelos & Gestão de Serviços</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de {segmentConfig.itemLabelPlural.toLowerCase()}, tipos de serviços solicitados e regras de cobrança
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={activeTab === 'SERVICES' ? "Buscar serviços..." : `Buscar ${segmentConfig.itemLabelSingular.toLowerCase()}...`}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {activeTab === 'MODELS' && hasPermission('manage_models') && (
            <Button 
              onClick={handleOpenAdd} 
              className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-1.5 shadow-sm text-white h-9"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo {segmentConfig.itemLabelSingular}</span>
            </Button>
          )}

          {activeTab === 'SERVICES' && (hasPermission('manage_services') || hasPermission('manage_models')) && (
            <Button 
              onClick={handleOpenAddService} 
              className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-1.5 shadow-sm text-white h-9"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Novo Serviço</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-0">
        <button
          onClick={() => setActiveTab('MODELS')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'MODELS'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>{segmentConfig.itemLabelPlural} & Modelos ({models.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'SERVICES'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Serviços & Procedimentos ({services.length})</span>
        </button>

        {hasPermission('manage_prices') && (
          <button
            onClick={() => setActiveTab('GLOBAL')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'GLOBAL'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Regras Globais & Operação</span>
          </button>
        )}
      </div>

      {/* TAB 1: MODELS & ITEMS */}
      {activeTab === 'MODELS' && (
        <div className="space-y-4">
          {/* Category Pills Filter */}
          {categoriesAvailable.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  categoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Todas as Categorias ({models.length})
              </button>
              {categoriesAvailable.map((cat, i) => {
                const count = models.filter(m => m.category === cat).length;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      categoryFilter === cat
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] opacity-80 px-1 py-0.2 rounded-full bg-black/10 dark:bg-white/20">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Grid of Models */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(mod => {
              const modRefill = mod.refill_price ?? globalRefill;
              const modVerif = mod.verification_price ?? globalVerification;
              const modTest = mod.test_price ?? globalTest;

              return (
                <Card key={mod.id} className="shadow-sm border-slate-200 dark:border-slate-800 hover:border-emerald-400 transition-all flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700">
                          {mod.brand_name || 'Fabricante N/I'}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          {mod.category && (
                            <Badge className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[10px]">
                              {mod.category}
                            </Badge>
                          )}
                          {mod.is_xl && <Badge className="bg-purple-700 text-white font-bold text-[10px]">XL Alta Cap.</Badge>}
                        </div>
                      </div>
                      <CardTitle className="text-base font-bold mt-2 text-slate-900 dark:text-slate-100">
                        {mod.model_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {mod.color ? <span>Cor/Tipo: <strong className="text-slate-800 dark:text-slate-200">{mod.color}</strong></span> : null}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-2 text-xs">
                      {/* Pricing Box */}
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl space-y-1.5 border border-emerald-200 dark:border-emerald-800/60">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">{segmentConfig.serviceLabel}:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{formatCurrency(modRefill)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Diagnóstico / Triagem:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(modVerif)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Teste Avulso:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(modTest)}</span>
                        </div>
                      </div>

                      {/* Weights info for Cartridges */}
                      {segmentConfig.hasWeightInspection && (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1 text-[11px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          <div className="flex justify-between">
                            <span>Capacidade:</span>
                            <strong>{mod.capacity_ml ? `${mod.capacity_ml} ml` : 'N/I'}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Peso Vazio Médio:</span>
                            <span>{mod.empty_weight_grams ? `${mod.empty_weight_grams} g` : 'N/I'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Peso Cheio Ideal:</span>
                            <strong className="text-emerald-600">{mod.full_weight_grams ? `${mod.full_weight_grams} g` : 'N/I'}</strong>
                          </div>
                        </div>
                      )}

                      {mod.technical_notes && (
                        <p className="text-slate-500 italic text-[11px] bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800/40">
                          <strong>Nota Técnica:</strong> {mod.technical_notes}
                        </p>
                      )}
                    </CardContent>
                  </div>

                  {hasPermission('manage_models') && (
                    <div className="p-3 pt-0 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleOpenEdit(mod)} 
                        className="text-xs gap-1.5 h-8 font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Item & Preços</span>
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES & PROCEDURES */}
      {activeTab === 'SERVICES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services
              .filter(s => 
                !searchFilter ||
                s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                (s.category && s.category.toLowerCase().includes(searchFilter.toLowerCase())) ||
                (s.description && s.description.toLowerCase().includes(searchFilter.toLowerCase()))
              )
              .map(srv => (
                <Card key={srv.id} className={`shadow-sm border transition-all flex flex-col justify-between ${
                  srv.is_active ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-400' : 'border-slate-200 bg-slate-50/70 dark:bg-slate-900/40 opacity-70'
                }`}>
                  <div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-bold text-xs bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                          {srv.category || 'Geral'}
                        </Badge>
                        <Badge className={srv.is_active ? 'bg-emerald-600 text-white text-[10px]' : 'bg-slate-400 text-white text-[10px]'}>
                          {srv.is_active ? 'Ativo no Balcão' : 'Inativo'}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold mt-2 text-slate-900 dark:text-slate-100">
                        {srv.title}
                      </CardTitle>
                      {srv.description && (
                        <CardDescription className="text-xs line-clamp-2 mt-1">
                          {srv.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="pt-2 text-xs space-y-2">
                      <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl flex items-center justify-between border border-emerald-200 dark:border-emerald-800/60">
                        <div>
                          <span className="text-[11px] text-slate-500 block font-medium">Valor Padrão Cobrado:</span>
                          <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                            {formatCurrency(srv.default_price)}
                          </span>
                        </div>
                        {srv.estimated_time_minutes && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Tempo Estimado:</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              {srv.estimated_time_minutes} min
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>

                  {(hasPermission('manage_services') || hasPermission('manage_models')) && (
                    <div className="p-3 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleService(srv)}
                        className={`text-xs gap-1 h-8 ${srv.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{srv.is_active ? 'Desativar' : 'Ativar'}</span>
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleOpenEditService(srv)} 
                          className="text-xs gap-1 h-8 font-semibold"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteService(srv)}
                          className="text-xs text-rose-600 hover:text-rose-700 h-8 px-2"
                          title="Excluir serviço"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL PRICING & POLICIES */}
      {activeTab === 'GLOBAL' && hasPermission('manage_prices') && (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>Configuração de Regras de Precificação & Operação da Empresa</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Defina os valores padrão Normal e XL, taxas de verificação e a responsabilidade da pesagem de entrada
                </CardDescription>
              </div>
              {settingsSavedAlert && (
                <Badge className="bg-emerald-600 text-white font-bold animate-in fade-in text-xs">
                  ✓ Regras Salvas com Sucesso!
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSaveGlobalPricing} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Preço Padrão Recarga Normal (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.50"
                    value={globalRefill}
                    onChange={(e) => setGlobalRefill(Number(e.target.value))}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400">Cartuchos de tamanho padrão</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Preço Padrão Recarga XL (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.50"
                    value={globalRefillXl}
                    onChange={(e) => setGlobalRefillXl(Number(e.target.value))}
                    className="text-xs font-bold text-purple-700 dark:text-purple-400"
                  />
                  <span className="text-[10px] text-slate-400">Cartuchos de alta capacidade (XL)</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Taxa de Verificação / Diagnóstico (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.50"
                    value={globalVerification}
                    onChange={(e) => setGlobalVerification(Number(e.target.value))}
                    className="text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                  <span className="text-[10px] text-slate-400">Cobrado em testes ou cartuchos condenados</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Taxa de Teste Avulso (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.50"
                    value={globalTest}
                    onChange={(e) => setGlobalTest(Number(e.target.value))}
                    className="text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                  <span className="text-[10px] text-slate-400">Folha de teste e alinhamento</span>
                </div>
              </div>

              {/* Input Weight Responsibility Setting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Responsabilidade da Pesagem de Entrada do Cartucho
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Defina quem deve preencher o peso inicial do cartucho:
                  </p>
                  <Select
                    value={inputWeightResponsibility}
                    onChange={(e) => setInputWeightResponsibility(e.target.value as any)}
                    className="text-xs"
                  >
                    <option value="AMBOS">Ambos (Atendente no Balcão ou Técnico na Bancada)</option>
                    <option value="ATENDENTE">Obrigatório pelo Atendente no Balcão de Entrada</option>
                    <option value="TECNICO">Exclusivo pelo Técnico na Bancada da Oficina</option>
                  </Select>
                </div>

                {/* Waiver Policy Toggle Box */}
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Verificação Gratuita na Recarga (Combo)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Isenta taxa de verificação quando o cliente solicita Recarga + Verificação.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waiveVerification}
                        onChange={(e) => setWaiveVerification(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9">
                  Salvar Regras de Precificação & Operação
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Modal Create / Edit Model */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {editingModelId ? `Editar ${segmentConfig.itemLabelSingular}` : `Cadastrar Novo ${segmentConfig.itemLabelSingular}`}
                </h3>
                <p className="text-xs text-slate-500">Defina especificações técnicas e valores individuais</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowModal(false)} className="h-8 w-8 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Marca / Fabricante *</label>
                  <Input 
                    required 
                    placeholder="Ex: Apple, HP, Bosch..." 
                    value={brandName} 
                    onChange={e => setBrandName(e.target.value)} 
                    className="text-xs font-semibold" 
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold mb-1 block">Nome do Modelo / Item *</label>
                  <Input 
                    required 
                    placeholder="Ex: iPhone 13, Furadeira HP1640..." 
                    value={modelName} 
                    onChange={e => setModelName(e.target.value)} 
                    className="text-xs font-semibold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Categoria</label>
                  <Input
                    placeholder="Ex: Smartphones, Furadeiras..."
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    list="category-suggestions"
                    className="text-xs"
                  />
                  <datalist id="category-suggestions">
                    {categoriesAvailable.map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1 block">Cor / Variante</label>
                  <Input 
                    placeholder="Ex: Preto, Azul, Cinza..." 
                    value={color} 
                    onChange={e => setColor(e.target.value)} 
                    className="text-xs" 
                  />
                </div>
              </div>

              {/* Specific Pricing Per Item */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  Tabela de Preços Deste {segmentConfig.itemLabelSingular}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5 block">Serviço Padrão (R$)</label>
                    <Input type="number" step="0.50" required value={refillPrice} onChange={e => setRefillPrice(e.target.value)} className="text-xs font-bold text-emerald-700" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5 block">Diagnóstico (R$)</label>
                    <Input type="number" step="0.50" required value={verificationPrice} onChange={e => setVerificationPrice(e.target.value)} className="text-xs font-bold" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5 block">Teste / Laudo (R$)</label>
                    <Input type="number" step="0.50" required value={testPrice} onChange={e => setTestPrice(e.target.value)} className="text-xs font-bold" />
                  </div>
                </div>
              </div>

              {/* Weights for Scale inspection */}
              {segmentConfig.hasWeightInspection && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Capacidade (ml)</label>
                    <Input type="number" step="0.5" placeholder="Ex: 8.5" value={capacityMl} onChange={e => setCapacityMl(e.target.value)} className="text-xs" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Peso Vazio (g)</label>
                    <Input type="number" step="0.1" placeholder="Ex: 27.5" value={emptyWeight} onChange={e => setEmptyWeight(e.target.value)} className="text-xs" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Peso Cheio (g)</label>
                    <Input type="number" step="0.1" placeholder="Ex: 33.5" value={fullWeight} onChange={e => setFullWeight(e.target.value)} className="text-xs" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold mb-1 block">Observações Técnicas</label>
                <textarea
                  className="w-full h-16 p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  placeholder="Dicas de reparo, compatibilidade de peças, tensão elétrica..."
                  value={techNotes}
                  onChange={e => setTechNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
                  {editingModelId ? 'Salvar Alterações' : 'Salvar Novo Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Create / Edit Service */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  <span>{editingServiceId ? 'Editar Serviço Solicitado' : 'Cadastrar Novo Serviço Solicitado'}</span>
                </h3>
                <p className="text-xs text-slate-500">Defina o nome, valor padrão e tempo estimado</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowServiceModal(false)} className="h-8 w-8 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">
                  Título do Serviço *
                </label>
                <Input 
                  required 
                  placeholder="Ex: Troca de Tela Frontal, Troca de Bateria, Recarga Express..." 
                  value={serviceTitle} 
                  onChange={e => setServiceTitle(e.target.value)} 
                  className="text-xs font-semibold" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">
                    Categoria
                  </label>
                  <Input
                    placeholder="Ex: Smartphones, Geral..."
                    value={serviceCategory}
                    onChange={e => setServiceCategory(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">
                    Valor Padrão (R$) *
                  </label>
                  <Input 
                    type="number"
                    step="0.50"
                    required
                    placeholder="0.00" 
                    value={servicePrice} 
                    onChange={e => setServicePrice(e.target.value)} 
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">
                  Tempo Estimado de Execução (Minutos)
                </label>
                <Input 
                  type="number"
                  placeholder="Ex: 30, 45, 60..." 
                  value={serviceEstTime} 
                  onChange={e => setServiceEstTime(e.target.value)} 
                  className="text-xs" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">
                  Descrição & Instruções de Procedimento
                </label>
                <textarea
                  className="w-full h-20 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  placeholder="Descreva o que está incluso neste serviço (ex: limpeza química, troca de selo térmico, garantia de 90 dias)..."
                  value={serviceDescription}
                  onChange={e => setServiceDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowServiceModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
                  {editingServiceId ? 'Salvar Alterações' : 'Salvar Serviço'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

