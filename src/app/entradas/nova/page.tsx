'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusCircle, 
  Trash2, 
  User, 
  Printer, 
  Check, 
  ArrowRight, 
  Scale, 
  UserPlus, 
  X, 
  Phone, 
  MessageSquare,
  Sparkles,
  AlertCircle,
  HelpCircle,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { 
  CartridgeModel, 
  Customer, 
  CartridgeEntry, 
  RequestedService, 
  PaymentMethod, 
  PaymentStatus,
  CompanySettings,
  ServicePrice,
  SegmentCustomization
} from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CustomerCombobox } from '@/components/CustomerCombobox';
import { ModelCombobox } from '@/components/ModelCombobox';

interface CartridgeItemInput {
  id: string;
  model_id: string;
  service_requested: RequestedService | string;
  color: string;
  is_xl: boolean;
  final_serie: string;
  reception_notes: string;
  accessories?: string;
  checklist?: Array<{ item: string; checked: boolean; notes?: string }>;
  input_weight_grams?: number;
  price: number;
  isVerificationWaived?: boolean;
  priceExplanation?: string;
}

export default function NovaEntradaPage() {
  const router = useRouter();
  const { currentCompany, currentUser, hasPermission } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [models, setModels] = useState<CartridgeModel[]>([]);
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));
  
  // Segment Dynamic Configuration
  const [segmentConfig, setSegmentConfig] = useState<SegmentCustomization>(AppStore.getSegmentConfig(currentCompany.id));

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DINHEIRO');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDENTE');
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  
  const [items, setItems] = useState<CartridgeItemInput[]>([
    {
      id: '1',
      model_id: '',
      service_requested: 'VERIFICACAO_E_RECARGA',
      color: '',
      is_xl: false,
      final_serie: '',
      reception_notes: '',
      accessories: '',
      checklist: (segmentConfig.defaultChecklistItems || []).map((item: string) => ({ item, checked: false })),
      input_weight_grams: undefined,
      price: 0,
      isVerificationWaived: false,
      priceExplanation: 'Selecione um modelo'
    }
  ]);

  // Inline Customer Quick Creation Modal
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustPhoneIsWhatsapp, setNewCustPhoneIsWhatsapp] = useState(true);
  const [newCustSecondaryPhone, setNewCustSecondaryPhone] = useState('');
  const [newCustSecondaryPhoneIsWhatsapp, setNewCustSecondaryPhoneIsWhatsapp] = useState(false);
  const [newCustDoc, setNewCustDoc] = useState('');

  // Created Entry Result (for thermal printing modal)
  const [createdEntry, setCreatedEntry] = useState<CartridgeEntry | null>(null);

  const loadData = () => {
    setCustomers(AppStore.getCustomers(currentCompany.id));
    setModels(AppStore.getModels(currentCompany.id));
    setServices(AppStore.getServicePrices(currentCompany.id));
    setSettings(AppStore.getSettings(currentCompany.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  if (!hasPermission('create_entry')) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Acesso Restrito ao Balcão</h2>
        <p className="text-xs text-slate-500">Seu perfil ({currentUser.role}) não tem permissão para emitir novas ordens de serviço.</p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="mt-2 text-xs">Voltar ao Painel</Button>
        </Link>
      </div>
    );
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Add Item Line
  const handleAddItem = () => {
    const nextId = (items.length + 1).toString();
    setItems([
      ...items,
      {
        id: nextId,
        model_id: '',
        service_requested: 'VERIFICACAO_E_RECARGA',
        color: '',
        is_xl: false,
        final_serie: '',
        reception_notes: '',
        accessories: '',
        checklist: (segmentConfig.defaultChecklistItems || []).map((item: string) => ({ item, checked: false })),
        input_weight_grams: undefined,
        price: 0,
        isVerificationWaived: false,
        priceExplanation: 'Selecione um modelo'
      }
    ]);
  };

  // Remove Item Line
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  // Toggle Checklist
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

    const primaryClean = newCustPhone.trim();
    const secondaryClean = newCustSecondaryPhone.trim();
    const effectiveWhatsapp = newCustPhoneIsWhatsapp 
      ? primaryClean 
      : (newCustSecondaryPhoneIsWhatsapp ? secondaryClean : '');

    const created = AppStore.addCustomer({
      tenant_id: currentCompany.id,
      name: newCustName.trim(),
      phone: primaryClean,
      phone_is_whatsapp: newCustPhoneIsWhatsapp,
      secondary_phone: secondaryClean,
      secondary_phone_is_whatsapp: newCustSecondaryPhoneIsWhatsapp,
      whatsapp: effectiveWhatsapp,
      document: newCustDoc.trim(),
      notes: 'Cadastrado no balcão de entrada'
    }, currentUser?.full_name || 'Atendente');

    const updatedCusts = AppStore.getCustomers(currentCompany.id);
    setCustomers(updatedCusts);
    setSelectedCustomerId(created.id);
    setShowQuickCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustPhoneIsWhatsapp(true);
    setNewCustSecondaryPhone('');
    setNewCustSecondaryPhoneIsWhatsapp(false);
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
      alert(`Por favor, selecione o modelo/equipamento para todos os ${segmentConfig.itemLabelPlural.toLowerCase()} recebidos.`);
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

  // Success Confirmation & Voucher Screen
  if (createdEntry) {
    const whatsappPhone = createdEntry.customer?.whatsapp || createdEntry.customer?.phone || '';
    const cleanPhone = whatsappPhone.replace(/\D/g, '');
    const trackingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/acompanhar/${createdEntry.tracking_token}`;
    const whatsappText = encodeURIComponent(
      `Olá ${createdEntry.customer?.name}!\nSua ordem de serviço nº *${createdEntry.entry_number}* foi aberta na *${currentCompany.trade_name}* com sucesso.\n\nValor: *${formatCurrency(createdEntry.total_amount)}*\nStatus Pagamento: *${createdEntry.payment_status === 'PAGO' ? 'Pago' : 'Pendente na Retirada'}*\n\nAcompanhe o status em tempo real:\n${trackingUrl}`
    );

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white dark:bg-[#0e1626] rounded-3xl border border-emerald-500/40 p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/40 animate-bounce">
            <Check className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Ordem de Serviço Registrada com Sucesso!
            </h2>
            <p className="text-xs text-slate-500 mt-1">Comprovante gerado e itens encaminhados para a bancada técnica</p>
            
            <div className="mt-3 inline-block px-5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">Número da Comanda / OS</span>
              <span className="font-mono font-black text-2xl text-emerald-700 dark:text-emerald-400">{createdEntry.entry_number}</span>
            </div>
          </div>

          {/* Receipt Preview Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2.5 max-w-lg mx-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Cliente:</span>
              <strong className="text-slate-900 dark:text-slate-100">{createdEntry.customer?.name}</strong>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Telefone:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{createdEntry.customer?.phone}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Pagamento:</span>
              <Badge className={createdEntry.payment_status === 'PAGO' ? 'bg-emerald-600 text-white font-bold' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold'}>
                {createdEntry.payment_status === 'PAGO' ? 'Pago na Entrada' : 'Pendente (Pagar na Retirada)'}
              </Badge>
            </div>

            <div className="pt-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">{segmentConfig.itemLabelPlural} ({createdEntry.cartridges?.length}):</p>
              <ul className="space-y-1 pl-1">
                {createdEntry.cartridges?.map(c => (
                  <li key={c.id} className="text-slate-600 dark:text-slate-300 font-mono text-[11px] flex items-center justify-between">
                    <span>• {c.serial_number} — {c.model?.model_name} {c.color ? `(${c.color})` : ''}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">[{c.final_serie}]</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-bold">
              <span>Total da Ordem:</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-lg font-black">{formatCurrency(createdEntry.total_amount)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => router.push(`/impressao?entry=${createdEntry.entry_number}`)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 h-11 px-5 rounded-xl shadow-md shadow-emerald-950/30"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Comanda Térmica (80mm)</span>
            </Button>

            {cleanPhone && (
              <a
                href={`https://wa.me/55${cleanPhone}?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-md shadow-teal-950/30"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </a>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setCreatedEntry(null);
                setItems([
                  {
                    id: '1',
                    model_id: '',
                    service_requested: 'VERIFICACAO_E_RECARGA',
                    color: '',
                    is_xl: false,
                    final_serie: '',
                    reception_notes: '',
                    accessories: '',
                    checklist: (segmentConfig.defaultChecklistItems || []).map((item: string) => ({ item, checked: false })),
                    input_weight_grams: undefined,
                    price: 0,
                    isVerificationWaived: false,
                    priceExplanation: 'Selecione um modelo'
                  }
                ]);
                setSelectedCustomerId('');
                setGeneralNotes('');
                setGeneralDiscount(0);
              }}
              className="w-full sm:w-auto h-11 px-5 rounded-xl text-xs font-bold border-slate-300 dark:border-slate-700"
            >
              + Nova Recepção
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <form onSubmit={handleSubmitEntry} className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                Balcão de Atendimento — Nova Entrada / OS
              </h1>
              <Badge className="bg-emerald-700 text-white text-[10px] font-bold">{segmentConfig.segmentName}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cadastre o cliente, selecione os {segmentConfig.itemLabelPlural.toLowerCase()} recebidos e feche a comanda
            </p>
          </div>
        </div>

        {/* Zone 1: Customer Selection */}
        <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xs">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Identificação do Cliente</h3>
                <p className="text-[11px] text-slate-500">Pesquise por nome, telefone, WhatsApp ou CPF/CNPJ</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQuickCustomerModal(true)}
              className="text-xs gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 h-8 rounded-xl font-bold"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Novo Cliente Rápido</span>
            </Button>
          </div>

          <div>
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
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-emerald-200/80 dark:border-emerald-800/60 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
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
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 mt-1 flex-wrap">
                    <span>Principal: <strong className="text-emerald-700 dark:text-emerald-400">{selectedCustomer.phone}</strong></span>
                    {selectedCustomer.secondary_phone && (
                      <span>Secundário: <strong>{selectedCustomer.secondary_phone}</strong></span>
                    )}
                    {selectedCustomer.document && <span>Doc: <strong>{selectedCustomer.document}</strong></span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedCustomer.whatsapp && (
                  <a
                    href={`https://wa.me/55${selectedCustomer.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomerId('')}
                  className="text-xs text-slate-400 hover:text-rose-600 h-8 px-2.5 rounded-lg"
                  title="Trocar cliente"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Trocar</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Zone 2: Equipment / Items Received */}
        <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {segmentConfig.itemLabelPlural} Recebidos ({items.length})
                </h3>
                <p className="text-[11px] text-slate-500">Adicione os itens e defina o serviço solicitado</p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddItem}
              size="sm"
              className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-3 rounded-xl font-bold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Adicionar Item</span>
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div 
                key={item.id}
                className="p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {segmentConfig.itemLabelSingular} #{index + 1}
                    </span>
                    {item.isVerificationWaived && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-300 dark:border-emerald-800">
                        ✓ Verificação Isenta
                      </span>
                    )}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Model Searchable Combobox */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>{segmentConfig.itemLabelSingular} / Modelo *</span>
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
                      className="text-xs font-semibold h-9 rounded-xl"
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

                  {/* Identifier Label */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      {segmentConfig.identifierLabel} {settings.require_cartridge_serial !== false ? <span className="text-rose-600 font-bold">*</span> : <span className="text-slate-400 font-normal">(Opcional)</span>}
                    </label>
                    <Input
                      placeholder={settings.require_cartridge_serial !== false ? `Ex: 94A1, IMEI...` : "Opcional (S/N)"}
                      value={item.final_serie}
                      onChange={(e) => handleUpdateItem(item.id, 'final_serie', e.target.value)}
                      required={settings.require_cartridge_serial !== false}
                      className="uppercase font-mono font-bold text-xs h-9 rounded-xl"
                    />
                  </div>

                  {/* Weight or Accessories */}
                  <div>
                    {segmentConfig.hasWeightInspection ? (
                      settings.input_weight_responsibility === 'TECNICO' ? (
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">
                            Pesagem de Entrada
                          </label>
                          <div 
                            className="h-9 px-2 bg-amber-50/80 dark:bg-amber-950/30 border border-dashed border-amber-300 dark:border-amber-800/60 rounded-xl flex items-center justify-center text-[10px] font-bold text-amber-800 dark:text-amber-300 text-center leading-tight cursor-not-allowed"
                            title="Configurado pela empresa: A pesagem de entrada é realizada exclusivamente pelo Técnico na Bancada"
                          >
                            ⚖️ Feita na Bancada
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
                            className="text-xs font-bold border-emerald-300 dark:border-emerald-700 h-9 rounded-xl"
                          />
                        </div>
                      )
                    ) : (
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                          Acessórios / Cabos
                        </label>
                        <Input
                          placeholder="Ex: Fonte, Capinha..."
                          value={item.accessories || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'accessories', e.target.value)}
                          className="text-xs h-9 rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Reception Notes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Observações da recepção (ex: carcaça com marcas, cliente relata falha de impressão...)"
                      value={item.reception_notes || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'reception_notes', e.target.value)}
                      className="text-xs h-9 rounded-xl"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Valor Aplicado (R$)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Calculado auto</span>
                    </div>
                    <Input
                      type="number"
                      step="0.50"
                      value={item.price}
                      onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                      className="font-black text-emerald-700 dark:text-emerald-400 text-xs h-9 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone 3: Financial Closing & Issuance */}
        <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xs">
              3
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Fechamento Financeiro & Emissão</h3>
              <p className="text-[11px] text-slate-500">Defina o pagamento e emita a ordem de serviço</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Observações Gerais da Ordem
                </label>
                <textarea
                  className="w-full h-20 p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-medium"
                  placeholder="Ex: Cliente solicita urgência para retirada no mesmo dia..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                />
              </div>

              {/* Payment Method Selector */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Condição de Pagamento</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 mb-0.5 block font-medium">Forma de Pagamento:</label>
                    <Select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="text-xs h-9 rounded-xl font-bold"
                    >
                      <option value="PIX">⚡ PIX</option>
                      <option value="DINHEIRO">💵 Dinheiro</option>
                      <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
                      <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
                      <option value="A_PRAZO">📋 A Prazo / Faturado</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 mb-0.5 block font-medium">Momento da Cobrança:</label>
                    <Select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                      className="text-xs h-9 rounded-xl font-bold"
                    >
                      <option value="PENDENTE">⏳ Pagar na Retirada</option>
                      <option value="PAGO">✅ Pago Antecipadamente</option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Box */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal dos Itens ({items.length}):</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Desconto Concedido (R$):</span>
                  <input
                    type="number"
                    step="1.00"
                    className="w-24 px-2.5 py-1 text-right text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-black text-rose-600"
                    value={generalDiscount}
                    onChange={(e) => setGeneralDiscount(Number(e.target.value))}
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Valor Total:</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 font-black py-3.5 text-sm rounded-xl shadow-lg shadow-emerald-950/40 text-white transition-transform hover:scale-[1.02]"
              >
                Gerar Entrada & Emitir Comanda
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Quick Customer Modal */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Cadastro Rápido de Cliente</h3>
              <p className="text-xs text-slate-500">Cadastre diretamente no balcão sem sair da tela</p>
            </div>

            <form onSubmit={handleCreateCustomerInline} className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block">Nome Completo *</label>
                <Input
                  required
                  placeholder="Nome do cliente"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              {/* Telefone Principal & Telefone Secundário com Checkboxes de WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Telefone Principal *
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-emerald-600 dark:text-emerald-400 select-none hover:text-emerald-700">
                      <input
                        type="checkbox"
                        checked={newCustPhoneIsWhatsapp}
                        onChange={(e) => setNewCustPhoneIsWhatsapp(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                      />
                      <span>É WhatsApp</span>
                    </label>
                  </div>
                  <Input
                    required
                    placeholder="(11) 99999-9999"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="text-xs h-9 rounded-xl"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Telefone Secundário
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-emerald-600 dark:text-emerald-400 select-none hover:text-emerald-700">
                      <input
                        type="checkbox"
                        checked={newCustSecondaryPhoneIsWhatsapp}
                        onChange={(e) => setNewCustSecondaryPhoneIsWhatsapp(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                      />
                      <span>É WhatsApp</span>
                    </label>
                  </div>
                  <Input
                    placeholder="(11) 98888-8888 (Opcional)"
                    value={newCustSecondaryPhone}
                    onChange={(e) => setNewCustSecondaryPhone(e.target.value)}
                    className="text-xs h-9 rounded-xl"
                  />
                </div>
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
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowQuickCustomerModal(false)} className="rounded-xl text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">
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
