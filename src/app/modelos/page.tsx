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
import { CartridgeModel, CompanySettings } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function CartridgeModelsPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [models, setModels] = useState<CartridgeModel[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));
  const [searchFilter, setSearchFilter] = useState('');
  
  // Create / Edit Model Modal
  const [showModal, setShowModal] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  // Form State
  const [brandName, setBrandName] = useState('HP');
  const [modelName, setModelName] = useState('');
  const [color, setColor] = useState('Preto');
  const [isXl, setIsXl] = useState(false);
  const [capacityMl, setCapacityMl] = useState('');
  const [emptyWeight, setEmptyWeight] = useState('');
  const [fullWeight, setFullWeight] = useState('');
  const [refillPrice, setRefillPrice] = useState('30.00');
  const [verificationPrice, setVerificationPrice] = useState('15.00');
  const [testPrice, setTestPrice] = useState('10.00');
  const [techNotes, setTechNotes] = useState('');

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
    const sets = AppStore.getSettings(currentCompany.id);
    setModels(mods);
    setSettings(sets);
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

  if (!currentUser) return null;

  const filtered = models.filter(m => 
    m.model_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.brand_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.color.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Open Add Model
  const handleOpenAdd = () => {
    setEditingModelId(null);
    setBrandName('HP');
    setModelName('');
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
    setBrandName(mod.brand_name || 'HP');
    setModelName(mod.model_name);
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
            <span>Catálogo de Modelos & Gestão de Preços</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuração de preços por cartucho, tabela padrão Normal/XL e regra de pesagem
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar modelo..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {hasPermission('manage_models') && (
            <Button 
              onClick={handleOpenAdd} 
              className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-1.5 shadow-sm text-white h-9"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Modelo</span>
            </Button>
          )}
        </div>
      </div>

      {/* Global Pricing & Waiver Rules Settings Card (Admin Only) */}
      {hasPermission('manage_prices') && (
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

      {/* Grid of Cartridge Models */}
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
                    <Badge variant="outline" className="font-bold text-xs bg-slate-100 text-slate-800 border-slate-300">
                      {mod.brand_name || 'Fabricante N/I'}
                    </Badge>
                    {mod.is_xl && <Badge className="bg-purple-700 text-white font-bold text-[10px]">XL Alta Cap.</Badge>}
                  </div>
                  <CardTitle className="text-base font-bold mt-2 text-slate-900 dark:text-slate-100">
                    {mod.model_name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cor: <strong className="text-slate-800 dark:text-slate-200">{mod.color}</strong>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-2 text-xs">
                  {/* Pricing Box */}
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl space-y-1.5 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Preço de Recarga:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{formatCurrency(modRefill)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Taxa de Verificação:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(modVerif)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Teste Avulso:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(modTest)}</span>
                    </div>
                  </div>

                  {/* Weights info */}
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
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenEdit(mod)}
                    className="text-xs gap-1.5 h-7 text-slate-700 dark:text-slate-300"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar Dados & Preços</span>
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Model Creation & Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {editingModelId ? 'Editar Modelo & Preços' : 'Cadastrar Novo Modelo'}
                </h3>
                <p className="text-xs text-slate-500">Defina especificações técnicas e valores individuais</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowModal(false)} className="h-8 w-8 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Fabricante *</label>
                  <Select value={brandName} onChange={e => setBrandName(e.target.value)} className="text-xs">
                    <option value="HP">HP</option>
                    <option value="Canon">Canon</option>
                    <option value="Epson">Epson</option>
                    <option value="Brother">Brother</option>
                    <option value="Lexmark">Lexmark</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1 block">Nome do Modelo *</label>
                  <Input required placeholder="Ex: HP 664, Canon PG-145" value={modelName} onChange={e => setModelName(e.target.value)} className="text-xs font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Cor *</label>
                  <Select value={color} onChange={e => setColor(e.target.value)} className="text-xs">
                    <option value="Preto">Preto</option>
                    <option value="Colorido">Colorido</option>
                    <option value="Ciano">Ciano</option>
                    <option value="Magenta">Magenta</option>
                    <option value="Amarelo">Amarelo</option>
                  </Select>
                </div>

                <div className="flex items-center pt-2 sm:pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input type="checkbox" checked={isXl} onChange={e => setIsXl(e.target.checked)} className="w-4 h-4 rounded text-emerald-600" />
                    <span>Alta Capacidade (XL)</span>
                  </label>
                </div>
              </div>

              {/* Specific Pricing Per Cartridge */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  Tabela de Preços Deste Cartucho:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5 block">Preço Recarga (R$)</label>
                    <Input type="number" step="0.50" required value={refillPrice} onChange={e => setRefillPrice(e.target.value)} className="text-xs font-bold text-emerald-700" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5 block">Verificação (R$)</label>
                    <Input type="number" step="0.50" required value={verificationPrice} onChange={e => setVerificationPrice(e.target.value)} className="text-xs font-bold" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5 block">Teste Impressão (R$)</label>
                    <Input type="number" step="0.50" required value={testPrice} onChange={e => setTestPrice(e.target.value)} className="text-xs font-bold" />
                  </div>
                </div>
              </div>

              {/* Weights */}
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

              <div>
                <label className="text-xs font-semibold mb-1 block">Observações Técnicas</label>
                <textarea
                  className="w-full h-16 p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  placeholder="Dicas de desentupimento, compatibilidade de chip..."
                  value={techNotes}
                  onChange={e => setTechNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
                  {editingModelId ? 'Salvar Alterações' : 'Salvar Novo Modelo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

