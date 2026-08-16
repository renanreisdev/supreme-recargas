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
  Share2,
  Tag,
  Layers,
  Wrench,
  Laptop,
  Smartphone,
  CheckSquare
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { 
  ItemCategory,
  ItemModel, 
  Customer, 
  ServiceOrder, 
  Service,
  PaymentMethod, 
  CompanySettings,
  Profile
} from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DialogModal, DialogModalProps } from '@/components/ui/dialog-modal';
import { CustomerCombobox } from '@/components/CustomerCombobox';
import { ModelCombobox } from '@/components/ModelCombobox';

interface ServiceItemServiceInput {
  service_id: string;
  selected: boolean;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  field_data?: Record<string, any>;
}

interface ServiceOrderItemInput {
  id: string;
  category_id: string;
  model_id: string;
  variant_id?: string;
  internal_identifier: string; // Serial / IMEI / Final de série
  reported_issue: string;
  reception_notes: string;
  accessories?: string;
  checklist?: Array<{ item: string; checked: boolean }>;
  custom_field_values?: Record<string, any>;
  input_weight_grams?: number;
  services: ServiceItemServiceInput[];
}

export default function NovaEntradaPage() {
  const router = useRouter();
  const { currentCompany, currentUser, hasPermission } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [models, setModels] = useState<ItemModel[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [assignedTechnicianId, setAssignedTechnicianId] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  const [hasInitialPayment, setHasInitialPayment] = useState(false);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number>(0);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<PaymentMethod>('PIX');

  const [items, setItems] = useState<ServiceOrderItemInput[]>([]);

  // Quick Customer Creation Modal
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustPhoneIsWhatsapp, setNewCustPhoneIsWhatsapp] = useState(true);
  const [newCustSecondaryPhone, setNewCustSecondaryPhone] = useState('');
  const [newCustSecondaryPhoneIsWhatsapp, setNewCustSecondaryPhoneIsWhatsapp] = useState(false);
  const [newCustDoc, setNewCustDoc] = useState('');

  // Created Order Result (for thermal printing modal)
  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);

  // Global Dialog Modal (Replaces standard browser alerts)
  const [dialogModal, setDialogModal] = useState<DialogModalProps | null>(null);

  const loadData = () => {
    const custs = AppStore.getCustomers(currentCompany.id);
    const cats = AppStore.getCategories(currentCompany.id);
    const mods = AppStore.getModels(currentCompany.id);
    const srvs = AppStore.getServices(currentCompany.id);
    const stts = AppStore.getSettings(currentCompany.id);
    const usrs = AppStore.getUsers(currentCompany.id);

    setCustomers(custs);
    setCategories(cats);
    setModels(mods);
    setAllServices(srvs);
    setSettings(stts);
    setTechnicians(usrs.filter(u => u.is_active));

    if (items.length === 0 && cats.length > 0) {
      const defaultCat = cats[0];
      const compatibleServices = srvs.filter(s => !s.category_ids || s.category_ids.length === 0 || s.category_ids.includes(defaultCat.id));
      const initialChecklist = (defaultCat?.checklist_items || []).map(item => ({ item, checked: false }));
      
      setItems([
        {
          id: '1',
          category_id: defaultCat.id,
          model_id: '',
          internal_identifier: '',
          reported_issue: '',
          reception_notes: '',
          accessories: '',
          checklist: initialChecklist,
          custom_field_values: {},
          input_weight_grams: undefined,
          services: compatibleServices.map((s, sIdx) => ({
            service_id: s.id,
            selected: sIdx === 0, // default first service selected
            unit_price: s.default_price || 0,
            quantity: 1,
            discount_amount: 0
          }))
        }
      ]);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  if (!hasPermission('create_entry') && !hasPermission('orders_create')) {
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
    const defaultCat = categories[0] || { id: 'cat-default', name: 'Geral', identifier_label: 'Nº de Série' };
    const compatibleServices = allServices.filter(s => !s.category_ids || s.category_ids.length === 0 || s.category_ids.includes(defaultCat.id));
    const initialChecklist = (defaultCat?.checklist_items || []).map(item => ({ item, checked: false }));

    setItems([
      ...items,
      {
        id: nextId,
        category_id: defaultCat.id,
        model_id: '',
        internal_identifier: '',
        reported_issue: '',
        reception_notes: '',
        accessories: '',
        checklist: initialChecklist,
        custom_field_values: {},
        input_weight_grams: undefined,
        services: compatibleServices.map((s, sIdx) => ({
          service_id: s.id,
          selected: sIdx === 0,
          unit_price: s.default_price || 0,
          quantity: 1,
          discount_amount: 0
        }))
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  // Change Item Category
  const handleChangeCategory = (itemId: string, newCatId: string) => {
    const cat = categories.find(c => c.id === newCatId);
    const compatibleServices = allServices.filter(s => !s.category_ids || s.category_ids.length === 0 || s.category_ids.includes(newCatId));
    const newChecklist = (cat?.checklist_items || []).map(item => ({ item, checked: false }));

    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      return {
        ...it,
        category_id: newCatId,
        model_id: '', // reset model on category change
        checklist: newChecklist,
        services: compatibleServices.map((s, sIdx) => ({
          service_id: s.id,
          selected: sIdx === 0,
          unit_price: s.default_price || 0,
          quantity: 1,
          discount_amount: 0
        }))
      };
    }));
  };

  // Toggle checklist item for item
  const handleToggleItemChecklist = (itemId: string, checkIndex: number) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const updated = (it.checklist || []).map((chk, idx) => idx === checkIndex ? { ...chk, checked: !chk.checked } : chk);
      return { ...it, checklist: updated };
    }));
  };

  // Toggle Service Selection on Item
  const handleToggleService = (itemId: string, serviceId: string) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const updatedServices = it.services.map(srv => {
        if (srv.service_id === serviceId) {
          return { ...srv, selected: !srv.selected };
        }
        return srv;
      });
      return { ...it, services: updatedServices };
    }));
  };

  // Update Service Price / Quantity on Item
  const handleUpdateServiceField = (itemId: string, serviceId: string, field: keyof ServiceItemServiceInput, value: any) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const updatedServices = it.services.map(srv => {
        if (srv.service_id === serviceId) {
          return { ...srv, [field]: value };
        }
        return srv;
      });
      return { ...it, services: updatedServices };
    }));
  };

  // Quick Customer Creation
  const handleCreateCustomerInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    if (settings.require_customer_document && !newCustDoc.trim()) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Documento Obrigatório',
        subtitle: 'Política cadastral da empresa',
        message: 'Pela política da empresa, o CPF ou CNPJ é obrigatório para cadastrar novos clientes.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
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
      document: newCustDoc.trim(),
      notes: 'Cadastrado no balcão de entrada'
    }, currentUser?.full_name || 'Atendente');

    const updatedCusts = AppStore.getCustomers(currentCompany.id);
    setCustomers(updatedCusts);
    setSelectedCustomerId(created.id);
    setShowQuickCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustSecondaryPhone('');
    setNewCustDoc('');
  };

  // Calculate Subtotals & Grand Total
  const calculateItemTotal = (item: ServiceOrderItemInput) => {
    return item.services
      .filter(s => s.selected)
      .reduce((sum, s) => sum + ((s.unit_price * (s.quantity || 1)) - (s.discount_amount || 0)), 0);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, it) => sum + calculateItemTotal(it), 0);
  };

  const subtotal = calculateSubtotal();
  const finalTotal = Math.max(0, subtotal - (generalDiscount || 0));

  // Submit Order
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Cliente Não Selecionado',
        message: 'Por favor, selecione ou cadastre o cliente antes de prosseguir com a emissão da Ordem de Serviço.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }

    if (settings.require_technician_on_entry && !assignedTechnicianId) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Técnico Responsável Obrigatório',
        subtitle: 'Configuração da Empresa',
        message: 'Pela política configurada na empresa, é obrigatório selecionar o Técnico Responsável para abrir a comanda.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.model_id) {
        setDialogModal({
          isOpen: true,
          type: 'warning',
          title: 'Modelo Não Selecionado',
          message: `O Item #${i + 1} está sem modelo selecionado. Por favor, escolha um modelo para continuar.`,
          isAlertOnly: true,
          confirmLabel: 'Entendido',
          onConfirm: () => setDialogModal(null)
        });
        return;
      }
      if (settings.require_item_serial && !item.internal_identifier.trim()) {
        const cat = categories.find(c => c.id === item.category_id);
        const label = cat?.identifier_label || 'Nº de Série / Identificador';
        setDialogModal({
          isOpen: true,
          type: 'warning',
          title: 'Identificador Obrigatório',
          message: `O campo ${label} é obrigatório no Item #${i + 1} pelas configurações da empresa.`,
          isAlertOnly: true,
          confirmLabel: 'Entendido',
          onConfirm: () => setDialogModal(null)
        });
        return;
      }
      const hasAnyService = item.services.some(s => s.selected);
      if (!hasAnyService) {
        setDialogModal({
          isOpen: true,
          type: 'warning',
          title: 'Nenhum Serviço Selecionado',
          message: `Por favor, selecione ao menos 1 serviço a ser executado no Item #${i + 1}.`,
          isAlertOnly: true,
          confirmLabel: 'Entendido',
          onConfirm: () => setDialogModal(null)
        });
        return;
      }
    }

    const assignedTech = technicians.find(t => t.id === assignedTechnicianId);

    const orderPayload = {
      tenant_id: currentCompany.id,
      customer_id: selectedCustomerId,
      opened_by: currentUser.id,
      opened_by_name: currentUser.full_name,
      assigned_technician_id: assignedTechnicianId || undefined,
      assigned_technician_name: assignedTech ? assignedTech.full_name : undefined,
      notes: generalNotes,
      discount_amount: generalDiscount,
      initial_payment: hasInitialPayment && initialPaymentAmount > 0 ? {
        amount: Math.min(finalTotal, initialPaymentAmount),
        payment_method: initialPaymentMethod
      } : undefined,
      items: items.map(it => ({
        model_id: it.model_id,
        variant_id: it.variant_id,
        internal_identifier: it.internal_identifier || 'S/N',
        reported_issue: it.reported_issue,
        reception_notes: it.reception_notes,
        accessories: it.accessories,
        checklist: it.checklist,
        assigned_technician_id: assignedTechnicianId || undefined,
        assigned_technician_name: assignedTech ? assignedTech.full_name : undefined,
        custom_field_values: {
          ...it.custom_field_values,
          input_weight_grams: it.input_weight_grams
        },
        services: it.services.filter(s => s.selected).map(s => ({
          service_id: s.service_id,
          quantity: s.quantity || 1,
          unit_price: s.unit_price,
          discount_amount: s.discount_amount || 0,
          field_data: it.input_weight_grams !== undefined ? { input_weight: it.input_weight_grams } : undefined
        }))
      }))
    };

    try {
      const created = AppStore.addServiceOrder(orderPayload, currentUser.full_name);
      setCreatedOrder(created);
    } catch (err: any) {
      setDialogModal({
        isOpen: true,
        type: 'danger',
        title: 'Erro ao Gerar OS',
        message: err?.message || 'Ocorreu um erro ao gerar a ordem de serviço.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
    }
  };

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Laptop': return <Laptop className="w-4 h-4" />;
      case 'Smartphone': return <Smartphone className="w-4 h-4" />;
      case 'Wrench': return <Wrench className="w-4 h-4" />;
      case 'Printer': return <Printer className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Global Dialog Modal */}
      {dialogModal && <DialogModal {...dialogModal} />}

      {/* Header Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <PlusCircle className="w-5 h-5" />
            </span>
            Nova Ordem de Serviço / Comanda
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Recepção ágil no balcão, cálculo dinâmico de serviços e emissão térmica imediata.
          </p>
        </div>

        <Link href="/entradas">
          <Button variant="outline" size="sm" className="rounded-xl text-xs">
            Ver Ordens Abertas
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmitOrder} className="space-y-6">
        {/* Customer Selection Card */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="p-4 md:p-5 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <CardTitle className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  Identificação do Cliente
                </CardTitle>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickCustomerModal(true)}
                className="h-8 text-xs font-semibold rounded-xl text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Novo Cliente Rápido</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Cliente Solicitante <span className="text-rose-500">*</span>
                </label>
                <CustomerCombobox
                  customers={customers}
                  selectedCustomerId={selectedCustomerId}
                  onSelect={setSelectedCustomerId}
                  onQuickRegister={() => setShowQuickCustomerModal(true)}
                  placeholder="Digite o nome, telefone ou CPF do cliente..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Técnico Responsável
                  </label>
                  <Badge className={settings.require_technician_on_entry ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[10px]' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]'}>
                    {settings.require_technician_on_entry ? 'Obrigatório *' : 'Opcional'}
                  </Badge>
                </div>
                <Select
                  value={assignedTechnicianId}
                  onChange={e => setAssignedTechnicianId(e.target.value)}
                  className="text-xs rounded-xl h-10"
                >
                  <option value="">{settings.require_technician_on_entry ? '-- Selecione o Técnico * --' : 'Nenhum / Atribuir na Oficina'}</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name} ({tech.role === 'TECNICO' ? 'Técnico' : tech.role === 'ADMINISTRADOR' ? 'Admin' : 'Equipe'})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {selectedCustomer && (
              <div className="mt-3 p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-medium">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>{selectedCustomer.name}</span>
                  <span className="text-slate-400">|</span>
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.document && (
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Doc: {selectedCustomer.document}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment & Service Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Itens e Serviços a Executar ({items.length})
              </h2>
            </div>

            <Button
              type="button"
              onClick={handleAddItem}
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold rounded-xl text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Adicionar Outro Item / Aparelho</span>
            </Button>
          </div>

          {items.map((item, idx) => {
            const currentCat = categories.find(c => c.id === item.category_id);
            const categoryModels = models.filter(m => m.category_id === item.category_id);
            const isScaleInspection = currentCat?.inspection_type === 'SCALE';
            const itemTotal = calculateItemTotal(item);

            return (
              <Card key={item.id} className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <div className="p-4 bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-900 text-white font-mono text-[11px] px-2 py-0.5">
                      Item #{idx + 1}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {currentCat?.name || 'Item'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Subtotal: {formatCurrency(itemTotal)}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                        title="Remover Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <CardContent className="p-4 md:p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category Selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Categoria do Equipamento</span>
                      </label>
                      <Select
                        value={item.category_id}
                        onChange={e => handleChangeCategory(item.id, e.target.value)}
                        className="h-10 text-xs rounded-xl"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Model Combobox */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>Modelo / Equipamento *</span>
                      </label>
                      <ModelCombobox
                        models={categoryModels.length > 0 ? categoryModels : models}
                        selectedModelId={item.model_id}
                        onSelect={modelId => {
                          const chosenModel = models.find(m => m.id === modelId);
                          setItems(prev => prev.map(it => {
                            if (it.id !== item.id) return it;
                            const updatedServices = it.services.map(srv => ({
                              ...srv,
                              unit_price: AppStore.getServicePriceForModel(srv.service_id, modelId)
                            }));
                            return {
                              ...it,
                              model_id: modelId,
                              services: updatedServices,
                              input_weight_grams: it.input_weight_grams !== undefined ? it.input_weight_grams : chosenModel?.empty_weight_grams
                            };
                          }));
                        }}
                        placeholder="Selecione ou busque o modelo..."
                        displayMode={settings.item_description_display_mode || 'BASIC'}
                        required
                      />
                    </div>

                    {/* Serial / Identifier */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                        <span>{currentCat?.identifier_label || 'Nº de Série / Identificador'}</span>
                      </label>
                      <Input
                        placeholder="Ex: A942, IMEI 849201, SN102"
                        value={item.internal_identifier}
                        onChange={e => {
                          const val = e.target.value;
                          setItems(prev => prev.map(it => it.id === item.id ? { ...it, internal_identifier: val } : it));
                        }}
                        className="h-10 text-xs rounded-xl font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Refill Balance Weight Input if applicable */}
                  {isScaleInspection && (
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-3">
                      <Scale className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="flex-1">
                        <label className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
                          Pesagem de Entrada na Balança (g)
                        </label>
                        <span className="text-[11px] text-slate-500">Pese o cartucho recebido para comparar com a saída pós-recarga.</span>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 28.5"
                          value={item.input_weight_grams !== undefined ? item.input_weight_grams : ''}
                          onChange={e => {
                            const val = e.target.value ? parseFloat(e.target.value) : undefined;
                            setItems(prev => prev.map(it => it.id === item.id ? { ...it, input_weight_grams: val } : it));
                          }}
                          className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900 text-right font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Accessories & Reported Issue */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Defeito Relatado pelo Cliente / Sintoma
                      </label>
                      <Input
                        placeholder="Ex: Tinta preta falhando, tela trincada, não liga..."
                        value={item.reported_issue}
                        onChange={e => {
                          const val = e.target.value;
                          setItems(prev => prev.map(it => it.id === item.id ? { ...it, reported_issue: val } : it));
                        }}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Acessórios / Observações de Entrada
                      </label>
                      <Input
                        placeholder="Ex: Carregador original, capinha, maleta com brocas..."
                        value={item.accessories || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setItems(prev => prev.map(it => it.id === item.id ? { ...it, accessories: val } : it));
                        }}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Checklist of Entry Inspection (if defined for this category) */}
                  {item.checklist && item.checklist.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>Checklist de Conferência de Entrada ({categories.find(c => c.id === item.category_id)?.name || 'Equipamento'})</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.checklist.filter(c => c.checked).length} de {item.checklist.length} itens conferidos
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {item.checklist.map((chk, cIdx) => (
                          <label
                            key={cIdx}
                            onClick={() => handleToggleItemChecklist(item.id, cIdx)}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all",
                              chk.checked
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-bold"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={chk.checked}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 text-emerald-600 rounded pointer-events-none"
                            />
                            <span className="truncate">{chk.item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Services Matrix on Item */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Serviços Solicitados para este Item:</span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {item.services.map(srvInput => {
                        const srvDef = allServices.find(s => s.id === srvInput.service_id);
                        if (!srvDef) return null;

                        return (
                          <div
                            key={srvInput.service_id}
                            onClick={() => handleToggleService(item.id, srvInput.service_id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                              srvInput.selected
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 shadow-sm'
                                : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={srvInput.selected}
                              onChange={() => {}} // handled by div click
                              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />

                            <div className="flex-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {srvDef.name}
                                </span>
                                <span className="font-black text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(srvInput.unit_price)}
                                </span>
                              </div>
                              {srvDef.description && (
                                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                  {srvDef.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Financial & General Notes Section */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="p-4 md:p-5 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <CardTitle className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                Resumo Financeiro & Conclusão
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Observações Gerais da Ordem de Serviço
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Cliente tem urgência; retirar na sexta-feira à tarde..."
                  value={generalNotes}
                  onChange={e => setGeneralNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Totals & Down Payment Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Subtotal Bruto ({items.length} item(ns)):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Desconto Comercial:</span>
                  <div className="w-28">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="R$ 0,00"
                      value={generalDiscount || ''}
                      onChange={e => setGeneralDiscount(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs rounded-lg text-right font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900 dark:text-white">Valor Total da OS:</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(finalTotal)}</span>
                </div>

                {/* Optional Down-payment toggle */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={hasInitialPayment}
                      onChange={e => {
                        setHasInitialPayment(e.target.checked);
                        if (e.target.checked && initialPaymentAmount === 0) {
                          setInitialPaymentAmount(finalTotal);
                        }
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Registrar pagamento / sinal adiantado no balcão</span>
                  </label>

                  {hasInitialPayment && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 animate-in fade-in-0 duration-150">
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">Forma de Pagamento:</span>
                        <Select
                          value={initialPaymentMethod}
                          onChange={e => setInitialPaymentMethod(e.target.value as PaymentMethod)}
                          className="h-8 text-xs rounded-lg"
                        >
                          <option value="PIX">PIX</option>
                          <option value="DINHEIRO">Dinheiro</option>
                          <option value="CARTAO_DEBITO">Cartão de Débito</option>
                          <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                        </Select>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">Valor Pago (R$):</span>
                        <Input
                          type="number"
                          step="0.01"
                          max={finalTotal}
                          value={initialPaymentAmount || ''}
                          onChange={e => setInitialPaymentAmount(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs rounded-lg font-bold text-right"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <Link href="/entradas">
                <Button type="button" variant="outline" className="rounded-xl text-xs h-10">
                  Cancelar
                </Button>
              </Link>

              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6 h-10 text-xs md:text-sm shadow-lg shadow-emerald-600/20 gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Emitir Ordem de Serviço & Imprimir</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Quick Customer Modal */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Cadastro Rápido de Cliente
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerInline} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Completo / Razão Social *
                </label>
                <Input
                  required
                  placeholder="Ex: João da Silva / Empresa LTDA"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Telefone Principal *
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-[11px] text-emerald-600 font-semibold">
                    <input
                      type="checkbox"
                      checked={newCustPhoneIsWhatsapp}
                      onChange={e => setNewCustPhoneIsWhatsapp(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>É WhatsApp</span>
                  </label>
                </div>
                <Input
                  required
                  placeholder="(11) 98765-4321"
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Telefone Secundário (Opcional)
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-[11px] text-emerald-600 font-semibold">
                    <input
                      type="checkbox"
                      checked={newCustSecondaryPhoneIsWhatsapp}
                      onChange={e => setNewCustSecondaryPhoneIsWhatsapp(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>É WhatsApp</span>
                  </label>
                </div>
                <Input
                  placeholder="(11) 3344-5566"
                  value={newCustSecondaryPhone}
                  onChange={e => setNewCustSecondaryPhone(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  CPF ou CNPJ {settings.require_customer_document ? '*' : '(Opcional)'}
                </label>
                <Input
                  placeholder="000.000.000-00"
                  value={newCustDoc}
                  onChange={e => setNewCustDoc(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickCustomerModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  Cadastrar e Selecionar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal & Thermal Printing Trigger */}
      {createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Ordem de Serviço Emitida com Sucesso!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Número Gerado: <span className="font-bold text-slate-900 dark:text-white font-mono">{createdOrder.order_number}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-900 dark:text-white">{createdOrder.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Itens / Aparelhos:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{createdOrder.items?.length} item(ns)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Total:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(createdOrder.total_amount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Link href={`/impressao?orderId=${createdOrder.id}`}>
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs h-10 gap-2">
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Térmica</span>
                </Button>
              </Link>

              <Link href={`/acompanhar/${createdOrder.tracking_token}`} target="_blank">
                <Button variant="outline" className="w-full font-bold rounded-xl text-xs h-10 gap-2">
                  <QrCode className="w-4 h-4 text-purple-600" />
                  <span>Ver Rastreio Online</span>
                </Button>
              </Link>
            </div>

            <div className="pt-2">
              <Button
                variant="ghost"
                onClick={() => router.push('/entradas')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Ir para Lista de Ordens & Histórico
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
