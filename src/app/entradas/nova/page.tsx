'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusCircle, 
  Trash2, 
  UserPlus, 
  Search, 
  Printer, 
  Check, 
  HelpCircle, 
  AlertCircle,
  FileText,
  CreditCard,
  Banknote,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowLeft,
  User,
  Phone,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { Customer, CartridgeModel, RequestedService, CartridgeEntry, PaymentMethod, PaymentStatus, CompanySettings, SegmentCustomization, ServicePrice } from '@/types';
import { formatCurrency, getPaymentMethodLabel } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ModelCombobox } from '@/components/ModelCombobox';
import { CustomerCombobox } from '@/components/CustomerCombobox';

interface CartridgeItemInput {
  id: string;
  model_id: string;
  service_requested: RequestedService | string;
  color: string;
  is_xl: boolean;
  final_serie: string;
  input_weight_grams?: number;
  accessories?: string;
  checklist?: Array<{ item: string; checked: boolean; notes?: string }>;
  reception_notes?: string;
  price: number;
  isVerificationWaived?: boolean;
  priceExplanation?: string;
}

export default function NewEntryPage() {
  const router = useRouter();
  const { currentCompany, currentUser, hasPermission } = useAuth();

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [models, setModels] = useState<CartridgeModel[]>([]);
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));
  const [segmentConfig, setSegmentConfig] = useState<SegmentCustomization>(AppStore.getSegmentConfig(currentCompany.id));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // Quick Customer Registration Modal state
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustDoc, setNewCustDoc] = useState('');

  // Cartridge Items State
  const [items, setItems] = useState<CartridgeItemInput[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDENTE');
  const [createdEntry, setCreatedEntry] = useState<CartridgeEntry | null>(null);

  useEffect(() => {
    const custs = AppStore.getCustomers(currentCompany.id);
    const mods = AppStore.getModels(currentCompany.id);
    const srvs = AppStore.getServices(currentCompany.id);
    const stt = AppStore.getSettings(currentCompany.id);
    const seg = AppStore.getSegmentConfig(currentCompany.id);
    setCustomers(custs);
    setModels(mods);
    setServices(srvs.filter(s => s.is_active));
    setSettings(stt);
    setSegmentConfig(seg);

    const initialChecklist = (stt.custom_checklist_items || seg.defaultChecklistItems || []).map(item => ({
      item,
      checked: false
    }));

    const defaultServiceType = srvs.length > 0 ? (srvs[0].service_type || srvs[0].id) : 'VERIFICACAO_E_RECARGA';

    // Start with 1 empty item (no pre-selected model, ready for searching)
    setItems([
      {
        id: `item-${Date.now()}`,
        model_id: '',
        service_requested: defaultServiceType,
        color: '',
        is_xl: false,
        final_serie: '',
        accessories: '',
        checklist: initialChecklist,
        price: 0,
        isVerificationWaived: false,
        priceExplanation: ''
      }
    ]);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  // Role Protection: Technician cannot make reception entries
  if (!hasPermission('create_entry') || currentUser.role === 'TECNICO') {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Acesso Restrito ao Balcão</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          O perfil de <strong>Técnico</strong> opera exclusivamente na bancada de testes e diagnósticos. Apenas <strong>Atendentes</strong> e <strong>Administradores</strong> podem realizar novas entradas de {segmentConfig.itemLabelPlural.toLowerCase()}.
        </p>
        <div className="pt-2">
          <Link href="/bancada">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Ir para Bancada do Técnico
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Add Item Line (Starts with empty model for quick typing)
  const handleAddItem = () => {
    const defaultServiceType = services.length > 0 ? (services[0].service_type || services[0].id) : 'VERIFICACAO_E_RECARGA';

    const initialChecklist = (settings.custom_checklist_items || segmentConfig.defaultChecklistItems || []).map(item => ({
      item,
      checked: false
    }));

    setItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        model_id: '',
        service_requested: defaultServiceType,
        color: '',
        is_xl: false,
        final_serie: '',
        accessories: '',
        checklist: initialChecklist,
        price: 0,
        isVerificationWaived: false,
        priceExplanation: ''
      }
    ]);
  };

  // Remove Item Line
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Toggle Checklist Item
  const handleToggleChecklist = (itemId: string, checkIndex: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId || !item.checklist) return item;
      const updatedChecklist = item.checklist.map((c, i) => 
        i === checkIndex ? { ...c, checked: !c.checked } : c
      );
      return { ...item, checklist: updatedChecklist };
    }));
  };

  // Update Item Line
  const handleUpdateItem = (id: string, field: keyof CartridgeItemInput, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // If model or service changed, recalculate price & waiver
      if (field === 'model_id' || field === 'service_requested') {
        const targetModelId = field === 'model_id' ? value : item.model_id;
        const targetService = field === 'service_requested' ? value : item.service_requested;

        if (field === 'model_id') {
          const foundModel = models.find(m => m.id === value);
          if (foundModel) {
            updated.color = foundModel.color;
            updated.is_xl = foundModel.is_xl;
          } else {
            updated.color = '';
            updated.is_xl = false;
          }
        }

        if (targetModelId) {
          const calc = AppStore.calculateItemPrice(currentCompany.id, targetModelId, targetService);
          updated.price = calc.finalPrice;
          updated.isVerificationWaived = calc.isVerificationWaived;
          updated.priceExplanation = calc.explanation;
        } else {
          updated.price = 0;
          updated.isVerificationWaived = false;
          updated.priceExplanation = 'Aguardando seleção do modelo';
        }
      }

      return updated;
    }));
  };

  // Quick Customer Creation
  const handleCreateCustomerInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    if (settings.require_customer_document && !newCustDoc.trim()) {
      alert('Pela política da empresa, o CPF ou CNPJ é obrigatório para cadastrar clientes.');
      return;
    }

    const created = AppStore.addCustomer({
      tenant_id: currentCompany.id,
      name: newCustName,
      phone: newCustPhone,
      document: newCustDoc,
      notes: 'Cadastrado no balcão de entrada'
    }, currentUser?.full_name || 'Atendente');

    const updatedCusts = AppStore.getCustomers(currentCompany.id);
    setCustomers(updatedCusts);
    setSelectedCustomerId(created.id);
    setShowQuickCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustDoc('');
  };

  // Subtotal & Total Calculation
  const subtotal = items.reduce((acc, i) => acc + (Number(i.price) || 0), 0);
  const totalAmount = Math.max(0, subtotal - (Number(generalDiscount) || 0));

  // Submit Entry
  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Por favor, pesquise e selecione um cliente antes de gerar a comanda.');
      return;
    }

    const missingModel = items.find(i => !i.model_id);
    if (missingModel) {
      alert(`Por favor, selecione ou pesquise o modelo/equipamento para todos os ${segmentConfig.itemLabelPlural.toLowerCase()} recebidos.`);
      return;
    }

    const isSerialRequired = settings.require_cartridge_serial !== false;
    if (isSerialRequired) {
      const invalidItem = items.find(i => !i.final_serie.trim());
      if (invalidItem) {
        alert(`Por favor, preencha o campo "${segmentConfig.identifierLabel}" de todos os itens.`);
        return;
      }
    }

    if (settings.input_weight_responsibility === 'ATENDENTE') {
      const missingWeight = items.find(i => !i.input_weight_grams || Number(i.input_weight_grams) <= 0);
      if (missingWeight) {
        alert('A configuração da empresa exige que a pesagem de entrada seja informada pelo Atendente no balcão.');
        return;
      }
    }

    const entry = AppStore.createEntry({
      tenant_id: currentCompany.id,
      customer_id: selectedCustomerId,
      attendant_id: currentUser.id,
      attendant_name: currentUser.full_name,
      general_notes: generalNotes,
      discount_amount: generalDiscount,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      items: items.map(i => ({
        model_id: i.model_id,
        service_requested: i.service_requested,
        color: i.color,
        is_xl: i.is_xl,
        final_serie: (i.final_serie.trim() || 'S/N').toUpperCase(),
        reception_notes: i.reception_notes,
        accessories: i.accessories,
        checklist: i.checklist,
        input_weight_grams: i.input_weight_grams ? Number(i.input_weight_grams) : undefined,
        price: Number(i.price) || 0
      }))
    });

    setCreatedEntry(entry);
  };

  if (createdEntry) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="border-emerald-600 bg-white dark:bg-slate-900 text-center p-8 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 font-bold shadow-lg">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Entrada Registrada com Sucesso!</h2>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Comanda N°: <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400 text-2xl">{createdEntry.entry_number}</span>
          </p>

          <div className="my-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left max-w-md mx-auto text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <strong className="text-slate-900 dark:text-slate-100">{createdEntry.customer?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Telefone:</span>
              <span>{createdEntry.customer?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status Pagamento:</span>
              <Badge className={createdEntry.payment_status === 'PAGO' ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-900'}>
                {createdEntry.payment_status === 'PAGO' ? 'Pago na Entrada' : 'Pendente (Pagar na Retirada)'}
              </Badge>
            </div>
            
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">{segmentConfig.itemLabelPlural} Registrados ({createdEntry.cartridges?.length}):</p>
              <ul className="space-y-1 pl-2">
                {createdEntry.cartridges?.map(c => (
                  <li key={c.id} className="text-slate-600 dark:text-slate-300 font-mono">
                    • <strong>{c.serial_number}</strong> — {c.model?.model_name} {c.color ? `(${c.color})` : ''} | {segmentConfig.identifierLabel}: <strong className="text-emerald-700 dark:text-emerald-400">{c.final_serie}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-bold">
              <span>Valor Total:</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(createdEntry.total_amount)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => router.push(`/impressao?entry=${createdEntry.entry_number}`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Comanda Térmica (58/80mm)</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setCreatedEntry(null);
                setItems([]);
                setSelectedCustomerId('');
              }}
            >
              Nova Recepção
            </Button>

            <Link href="/entradas">
              <Button variant="ghost">
                Ver Lista de Entradas
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <form onSubmit={handleSubmitEntry} className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Balcão de Atendimento — Nova Entrada</span>
            <Badge className="bg-emerald-700 text-white text-[11px]">{segmentConfig.segmentName}</Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identifique o cliente, cadastre os {segmentConfig.itemLabelPlural.toLowerCase()} recebidos e emita o comprovante
          </p>
        </div>
      </div>

      {/* Customer Selection Section */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>1. Identificação do Cliente</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Pesquise por nome, telefone, CPF/CNPJ ou selecione o cliente cadastrado
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQuickCustomerModal(true)}
              className="text-xs gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 h-8"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Cadastrar Novo Cliente</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Cliente *</span>
              <span className="text-[10px] text-slate-400 font-normal">Inicia vazio — Digite para pesquisar</span>
            </label>
            <CustomerCombobox
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelect={(id) => setSelectedCustomerId(id)}
              onQuickRegister={() => setShowQuickCustomerModal(true)}
              required
              placeholder="Buscar cliente por nome, telefone, CPF/CNPJ ou código..."
            />
          </div>

          {selectedCustomer && (
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedCustomer.name}</span>
                    {selectedCustomer.internal_code && (
                      <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0 bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold">
                        #{selectedCustomer.internal_code}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 flex-wrap">
                    <span>Tel: <strong className="text-emerald-700 dark:text-emerald-400">{selectedCustomer.phone}</strong></span>
                    {selectedCustomer.document && <span>Doc: <strong>{selectedCustomer.document}</strong></span>}
                    {selectedCustomer.company_name && <span>Empresa: <strong>{selectedCustomer.company_name}</strong></span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedCustomer.whatsapp && (
                  <a
                    href={`https://wa.me/55${selectedCustomer.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomerId('')}
                  className="text-xs text-slate-400 hover:text-rose-600 h-8 px-2"
                  title="Trocar cliente"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Trocar</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cartridge Line Items */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              2. {segmentConfig.itemLabelPlural} Recebidos ({items.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Valores e parâmetros calculados de acordo com o segmento {segmentConfig.segmentName}
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={handleAddItem}
            size="sm"
            className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Adicionar Mais 1 {segmentConfig.itemLabelSingular}</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div 
              key={item.id}
              className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 relative space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {segmentConfig.itemLabelSingular} #{index + 1}
                  </span>
                  {item.isVerificationWaived && (
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                      ✓ Taxa de Verificação Isenta
                    </span>
                  )}
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remover
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {/* Model Searchable Combobox */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>{segmentConfig.itemLabelSingular} *</span>
                    <span className="text-[10px] text-slate-400 font-normal">Digite para pesquisar</span>
                  </label>
                  <ModelCombobox
                    models={models}
                    selectedModelId={item.model_id}
                    onSelect={(modelId) => handleUpdateItem(item.id, 'model_id', modelId)}
                    itemLabelSingular={segmentConfig.itemLabelSingular}
                    required
                  />
                </div>

                {/* Service Requested */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    {segmentConfig.serviceLabel} *
                  </label>
                  <Select
                    value={item.service_requested}
                    onChange={(e) => handleUpdateItem(item.id, 'service_requested', e.target.value)}
                    required
                    className="text-xs font-medium"
                  >
                    {services.length > 0 ? (
                      services.map(s => (
                        <option key={s.id} value={s.service_type || s.id}>
                          {s.title} — R$ {Number(s.default_price).toFixed(2)}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="VERIFICACAO_E_RECARGA">Diagnóstico + Serviço</option>
                        <option value="RECARGA">Serviço Padrão</option>
                        <option value="VERIFICACAO">Somente Diagnóstico / Orçamento</option>
                        <option value="TESTE">Teste & Inspeção</option>
                      </>
                    )}
                  </Select>
                </div>

                {/* Identifier Label (IMEI / Serial / Final de Série) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    {segmentConfig.identifierLabel} {settings.require_cartridge_serial !== false ? <span className="text-rose-600 font-bold">*</span> : <span className="text-slate-400 font-normal">(Opcional)</span>}
                  </label>
                  <Input
                    placeholder={settings.require_cartridge_serial !== false ? `Ex: 94A1, IMEI...` : "Opcional (S/N)"}
                    value={item.final_serie}
                    onChange={(e) => handleUpdateItem(item.id, 'final_serie', e.target.value)}
                    required={settings.require_cartridge_serial !== false}
                    className="uppercase font-mono font-bold text-xs"
                  />
                </div>

                {/* Weight Input (If Segment uses Scale/Weights) or Accessory Input */}
                <div>
                  {segmentConfig.hasWeightInspection ? (
                    settings.input_weight_responsibility === 'TECNICO' ? (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">
                          Pesagem de Entrada
                        </label>
                        <div 
                          className="h-9 px-2 bg-amber-50/80 dark:bg-amber-950/30 border border-dashed border-amber-300 dark:border-amber-800/60 rounded-md flex items-center justify-center text-[10px] font-bold text-amber-800 dark:text-amber-300 text-center leading-tight cursor-not-allowed"
                          title="Configurado pela empresa: A pesagem de entrada é realizada exclusivamente pelo Técnico na Bancada"
                        >
                          ⚖️ Feita na Bancada (Técnico)
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                          Peso Entrada (g) {settings.input_weight_responsibility === 'ATENDENTE' ? <span className="text-rose-600 font-bold">*</span> : <span className="text-slate-400 font-normal">(Opcional)</span>}
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 28.5"
                          required={settings.input_weight_responsibility === 'ATENDENTE'}
                          value={item.input_weight_grams || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'input_weight_grams', e.target.value)}
                          className="text-xs font-bold border-emerald-300 dark:border-emerald-700 focus:ring-emerald-500"
                        />
                      </div>
                    )
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                        Acessórios / Cabos
                      </label>
                      <Input
                        placeholder="Ex: Fonte, Capinha, Chip..."
                        value={item.accessories || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'accessories', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Checklist Inspection (For Device / Tool / General Workshops) */}
              {segmentConfig.hasChecklist && item.checklist && item.checklist.length > 0 && (
                <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Checklist de Recebimento & Estado Físico:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {item.checklist.map((chk, cIdx) => (
                      <label 
                        key={cIdx} 
                        className={`flex items-center gap-2 p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                          chk.checked 
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold' 
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={chk.checked}
                          onChange={() => handleToggleChecklist(item.id, cIdx)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 border-slate-300"
                        />
                        <span className="truncate">{chk.item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Reception Notes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Observações da recepção (ex: riscado na carcaça, cliente informa que não liga...)"
                    value={item.reception_notes || ''}
                    onChange={(e) => handleUpdateItem(item.id, 'reception_notes', e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Valor Aplicado (R$)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Calculado auto</span>
                  </div>
                  <Input
                    type="number"
                    step="0.50"
                    value={item.price}
                    onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                    className="font-bold text-emerald-700 dark:text-emerald-400 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totals, Payment & Confirmation */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Observações Gerais da Comanda
                </label>
                <textarea
                  className="w-full h-20 p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ex: Cliente avisou que precisa com urgência até às 17h..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                />
              </div>

              {/* Payment details at intake */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Condição de Pagamento</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 mb-0.5 block">Forma Prevista:</label>
                    <Select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="text-xs"
                    >
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="CARTAO_DEBITO">Cartão de Débito</option>
                      <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                      <option value="A_PRAZO">A Prazo / Faturado</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 mb-0.5 block">Momento do Pagamento:</label>
                    <Select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                      className="text-xs"
                    >
                      <option value="PENDENTE">Pagar na Retirada</option>
                      <option value="PAGO">Pago Antecipadamente</option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Subtotal dos Serviços ({items.length} itens):</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Desconto Concedido (R$):</span>
                <input
                  type="number"
                  step="1.00"
                  className="w-24 px-2 py-1 text-right text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold text-rose-600"
                  value={generalDiscount}
                  onChange={(e) => setGeneralDiscount(Number(e.target.value))}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Valor Final da Comanda:</span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold py-3 text-sm shadow-md text-white">
                Salvar Entrada e Emitir Comanda
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </form>

      {/* Quick Customer Modal */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Cadastro Rápido de Cliente</h3>
              <p className="text-xs text-slate-500">Cadastre o cliente diretamente no balcão sem sair da tela</p>
            </div>

            <form onSubmit={handleCreateCustomerInline} className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block">Nome Completo *</label>
                <Input
                  required
                  placeholder="Nome do cliente"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Telefone / WhatsApp *</label>
                <Input
                  required
                  placeholder="(11) 99999-9999"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">
                  CPF / CNPJ {settings.require_customer_document ? <span className="text-rose-600 font-bold">* (Obrigatório)</span> : <span className="text-slate-400 font-normal">(Opcional)</span>}
                </label>
                <Input
                  required={settings.require_customer_document}
                  placeholder={settings.require_customer_document ? "000.000.000-00 (Obrigatório)" : "000.000.000-00 (Opcional)"}
                  value={newCustDoc}
                  onChange={(e) => setNewCustDoc(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowQuickCustomerModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Salvar Cliente
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

