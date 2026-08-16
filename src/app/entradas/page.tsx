'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ClipboardList, 
  Search, 
  Eye, 
  Printer, 
  PackageCheck, 
  User, 
  Calendar, 
  CheckCircle2,
  Clock,
  PlusCircle,
  FileText,
  DollarSign,
  CreditCard,
  Banknote,
  Sparkles,
  Info,
  CheckCircle,
  XCircle,
  Receipt,
  Trash2,
  Split,
  Plus,
  RotateCcw,
  AlertTriangle,
  Percent,
  Lock,
  X,
  Phone,
  MessageSquare,
  QrCode
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { ServiceOrder, PaymentMethod, PaymentStatus, PaymentSplit } from '@/types';
import { formatCurrency, formatDateTime, getPaymentMethodLabel, getPaymentStatusBadge, getStatusBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DialogModal, DialogModalProps } from '@/components/ui/dialog-modal';

function EntriesListContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'DELIVERED' | 'PROCESSING'>('ALL');
  
  // Delivery Checkout Modal State
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<ServiceOrder | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverDoc, setReceiverDoc] = useState('');
  const [receiverRelation, setReceiverRelation] = useState('Próprio Cliente');
  const [payments, setPayments] = useState<Array<{ id: string; method: PaymentMethod; amount: number }>>([]);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [discountOption, setDiscountOption] = useState<'SALDO_PENDENTE' | 'CONCEDER_DESCONTO'>('SALDO_PENDENTE');

  // Reopen Modal State
  const [orderToReopen, setOrderToReopen] = useState<ServiceOrder | null>(null);
  const [reopenReason, setReopenReason] = useState('Cliente solicitou reteste/retrabalho');
  const [showReopenModal, setShowReopenModal] = useState(false);

  // Delete Modal State
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Notification
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Global Dialog Modal (Replaces browser alert)
  const [dialogModal, setDialogModal] = useState<DialogModalProps | null>(null);

  const canRegisterDelivery = hasPermission('register_delivery') || hasPermission('orders_deliver') || currentUser?.role === 'ADMINISTRADOR';
  const canApplyDiscount = hasPermission('apply_discount_on_delivery') || hasPermission('orders_discount') || currentUser?.role === 'ADMINISTRADOR';
  const canReopenEntry = hasPermission('reopen_entry') || hasPermission('orders_reopen') || currentUser?.role === 'ADMINISTRADOR';
  const canDeleteEntry = hasPermission('delete_entry') || hasPermission('orders_cancel') || currentUser?.role === 'ADMINISTRADOR';

  const loadData = () => {
    const data = AppStore.getServiceOrders(currentCompany.id);
    setOrders(data);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  if (!currentUser) return null;

  if (!hasPermission('view_entries') && !hasPermission('orders_view')) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
          <ClipboardList className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Acesso Restrito às Ordens de Serviço</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Seu usuário não possui permissão para visualizar a lista geral de ordens de serviço. Solicite ao Administrador o ajuste.
        </p>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button className="bg-slate-900 text-white font-bold rounded-xl">Voltar ao Painel</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Open Delivery Checkout Modal
  const handleOpenDeliveryModal = (order: ServiceOrder) => {
    setSelectedOrderForDelivery(order);
    setReceiverName(order.customer?.name || '');
    setReceiverDoc(order.customer?.document || '');
    setReceiverRelation('Próprio Cliente');
    setDeliveryNotes('');
    setDiscountOption('SALDO_PENDENTE');

    const remainingToPay = Math.max(0, order.total_amount - (order.paid_amount || 0));

    setPayments([
      {
        id: `pay-${Date.now()}-1`,
        method: 'PIX',
        amount: remainingToPay
      }
    ]);
  };

  const handleAddPaymentLine = () => {
    if (!selectedOrderForDelivery) return;
    const currentPaidSum = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const orderRemaining = Math.max(0, selectedOrderForDelivery.total_amount - (selectedOrderForDelivery.paid_amount || 0));
    const stillDue = Math.max(0, orderRemaining - currentPaidSum);

    setPayments([
      ...payments,
      {
        id: `pay-${Date.now()}-${payments.length + 1}`,
        method: 'DINHEIRO',
        amount: stillDue
      }
    ]);
  };

  const handleRemovePaymentLine = (id: string) => {
    if (payments.length <= 1) return;
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleUpdatePaymentLine = (id: string, field: 'method' | 'amount', value: any) => {
    setPayments(payments.map(p => {
      if (p.id === id) {
        return {
          ...p,
          [field]: field === 'amount' ? (Number(value) || 0) : value
        };
      }
      return p;
    }));
  };

  const modalRemainingToPay = selectedOrderForDelivery 
    ? Math.max(0, selectedOrderForDelivery.total_amount - (selectedOrderForDelivery.paid_amount || 0))
    : 0;
  const totalPaidSum = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const diff = totalPaidSum - modalRemainingToPay;
  const liveChange = diff > 0 ? diff : 0;
  const liveRemaining = diff < 0 ? Math.abs(diff) : 0;
  const isUnderpaid = liveRemaining > 0;

  const handleRegisterDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDelivery) return;

    if (isUnderpaid && discountOption === 'CONCEDER_DESCONTO' && !canApplyDiscount) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Permissão Insuficiente',
        subtitle: 'Concessão de desconto bloqueada',
        message: 'Você não possui permissão para conceder descontos na baixa. O administrador precisa liberar esta permissão nas configurações de perfil.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }

    try {
      AppStore.deliverServiceOrder(selectedOrderForDelivery.id, {
        receiver_name: receiverName.trim(),
        receiver_document: receiverDoc.trim(),
        receiver_relation: receiverRelation,
        notes: deliveryNotes,
        payments: payments.map(p => ({ payment_method: p.method, amount: p.amount })),
        apply_discount: isUnderpaid && discountOption === 'CONCEDER_DESCONTO' ? liveRemaining : 0
      }, currentUser.full_name);

      loadData();
      setSelectedOrderForDelivery(null);
      setActionAlert({ 
        type: 'success', 
        message: `Baixa e entrega da OS concluída com sucesso!` 
      });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setDialogModal({
        isOpen: true,
        type: 'danger',
        title: 'Erro ao Registrar Baixa',
        message: err?.message || 'Ocorreu um erro inesperado ao salvar a entrega.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
    }
  };

  const handleOpenReopenModal = (order: ServiceOrder) => {
    setOrderToReopen(order);
    setReopenReason('Cliente solicitou reteste/retrabalho na bancada');
    setShowReopenModal(true);
  };

  const handleConfirmReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToReopen) return;

    try {
      AppStore.reopenServiceOrder(orderToReopen.id, reopenReason, currentUser.full_name);
      loadData();
      setShowReopenModal(false);
      setOrderToReopen(null);
      setActionAlert({ type: 'success', message: 'Ordem de serviço reaberta com sucesso e enviada de volta à bancada!' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setDialogModal({
        isOpen: true,
        type: 'danger',
        title: 'Erro ao Reabrir OS',
        message: err?.message || 'Não foi possível reabrir a ordem de serviço.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
    }
  };

  const handleOpenDeleteModal = (order: ServiceOrder) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!orderToDelete) return;
    try {
      AppStore.deleteServiceOrder(orderToDelete.id, currentUser.full_name);
      loadData();
      setShowDeleteModal(false);
      setOrderToDelete(null);
      setActionAlert({ type: 'success', message: 'Ordem de serviço excluída com sucesso.' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setDialogModal({
        isOpen: true,
        type: 'danger',
        title: 'Erro ao Excluir OS',
        message: err?.message || 'Não foi possível excluir a ordem de serviço.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'READY') {
      if (o.status !== 'PRONTA') return false;
    } else if (statusFilter === 'DELIVERED') {
      if (o.status !== 'ENTREGUE') return false;
    } else if (statusFilter === 'PROCESSING') {
      if (o.status === 'ENTREGUE' || o.status === 'CANCELADA') return false;
    }

    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase().trim();
    const orderNum = o.order_number.toLowerCase();
    const custName = o.customer?.name.toLowerCase() || '';
    const custPhone = o.customer?.phone.toLowerCase() || '';
    const custDoc = o.customer?.document?.toLowerCase() || '';
    const hasMatchingItem = o.items?.some(it => 
      it.internal_identifier.toLowerCase().includes(query) || 
      (it.model?.name || '').toLowerCase().includes(query)
    );

    return orderNum.includes(query) || custName.includes(query) || custPhone.includes(query) || custDoc.includes(query) || !!hasMatchingItem;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Global Dialog Modal */}
      {dialogModal && <DialogModal {...dialogModal} />}

      {/* Alert banner */}
      {actionAlert && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in-0 duration-150 ${
          actionAlert.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          <span>{actionAlert.message}</span>
          <button onClick={() => setActionAlert(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-slate-900 text-white shadow-md">
              <ClipboardList className="w-5 h-5" />
            </span>
            Ordens de Serviço & Entregas
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Histórico completo de atendimentos, controle financeiro e baixa no balcão.
          </p>
        </div>

        <Link href="/entradas/nova">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 gap-1.5 shadow-md shadow-emerald-600/20">
            <PlusCircle className="w-4 h-4" />
            <span>+ Nova Ordem / Comanda</span>
          </Button>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === 'ALL' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Todas ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PROCESSING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === 'PROCESSING' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Em Andamento
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('READY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === 'READY' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Prontas p/ Retirada
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('DELIVERED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === 'DELIVERED' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Entregues
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por OS, cliente, serial ou modelo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Orders List Table */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Nº da OS</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Itens / Equipamentos</th>
                <th className="py-3 px-4">Data Abertura</th>
                <th className="py-3 px-4">Status Operacional</th>
                <th className="py-3 px-4">Financeiro</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-600">
                    Nenhuma ordem de serviço encontrada.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const statusConfig = getStatusBadgeConfig(order.status);
                  const finConfig = getPaymentStatusBadge(order.financial_status);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* OS Number & Token */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {order.order_number}
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {order.customer?.name || 'Cliente'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{order.customer?.phone}</span>
                        </div>
                      </td>

                      {/* Items Summary */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          {order.items?.map((it, i) => (
                            <div key={i} className="text-[11px] text-slate-700 dark:text-slate-300 truncate">
                              <span className="font-semibold text-slate-900 dark:text-white">{it.model?.name}</span>
                              <span className="font-mono text-slate-400 ml-1">({it.internal_identifier})</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDateTime(order.opened_at)}
                      </td>

                      {/* Operational Status */}
                      <td className="py-3.5 px-4">
                        <Badge className={`${statusConfig.className} text-[10px] font-bold`}>
                          {statusConfig.label}
                        </Badge>
                      </td>

                      {/* Financial Status */}
                      <td className="py-3.5 px-4">
                        <Badge className={`${finConfig.className} text-[10px]`}>
                          {finConfig.label}
                        </Badge>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(order.total_amount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {order.status !== 'ENTREGUE' && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenDeliveryModal(order)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-xl px-2.5 shadow-sm"
                          >
                            <PackageCheck className="w-3.5 h-3.5 mr-1" />
                            <span>Baixa / Entrega</span>
                          </Button>
                        )}

                        {order.status === 'ENTREGUE' && canReopenEntry && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReopenModal(order)}
                            className="text-amber-600 border-amber-300 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs h-8 rounded-xl px-2"
                            title="Reabrir Ordem"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Link href={`/impressao?orderId=${order.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 rounded-xl px-2 text-slate-600 dark:text-slate-300"
                            title="Imprimir Térmica"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                        </Link>

                        <Link href={`/acompanhar/${order.tracking_token}`} target="_blank">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 rounded-xl px-2 text-purple-600 border-purple-200 dark:border-purple-900/40"
                            title="Rastreio Online"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </Button>
                        </Link>

                        {canDeleteEntry && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDeleteModal(order)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs h-8 rounded-xl px-2"
                            title="Excluir Ordem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Delivery Checkout Modal */}
      {selectedOrderForDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600" />
                  Registro de Baixa & Entrega
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Ordem nº {selectedOrderForDelivery.order_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDelivery(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDelivery} className="space-y-4">
              {/* Receiver Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nome do Recebedor *
                  </label>
                  <Input
                    required
                    placeholder="Quem está retirando..."
                    value={receiverName}
                    onChange={e => setReceiverName(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Relação c/ Cliente:
                  </label>
                  <Select
                    value={receiverRelation}
                    onChange={e => setReceiverRelation(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  >
                    <option value="Próprio Cliente">Próprio Cliente</option>
                    <option value="Funcionário / Portador">Funcionário / Portador</option>
                    <option value="Familiar">Familiar</option>
                    <option value="Outro">Outro</option>
                  </Select>
                </div>
              </div>

              {/* Payments Split Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Pagamentos & Baixa Financeira</span>
                  <span className="font-bold text-emerald-600">Saldo a Pagar: {formatCurrency(modalRemainingToPay)}</span>
                </div>

                {payments.map((p, pIdx) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Select
                      value={p.method}
                      onChange={e => handleUpdatePaymentLine(p.id, 'method', e.target.value)}
                      className="h-8 text-xs rounded-lg flex-1"
                    >
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="CARTAO_DEBITO">Cartão de Débito</option>
                      <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                      <option value="A_PRAZO">A Prazo / Faturado</option>
                      <option value="ISENTO">Isento / Garantia</option>
                    </Select>

                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Valor"
                      value={p.amount || ''}
                      onChange={e => handleUpdatePaymentLine(p.id, 'amount', e.target.value)}
                      className="h-8 text-xs rounded-lg w-28 text-right font-bold"
                    />

                    {payments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePaymentLine(p.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddPaymentLine}
                    className="text-xs text-emerald-600 h-7 px-2"
                  >
                    + Dividir em Outra Forma (Split)
                  </Button>

                  <div className="text-right text-xs">
                    {liveChange > 0 && <span className="text-emerald-600 font-bold">Troco: {formatCurrency(liveChange)}</span>}
                    {liveRemaining > 0 && <span className="text-amber-600 font-bold">Faltante: {formatCurrency(liveRemaining)}</span>}
                  </div>
                </div>
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Observações de Entrega (Opcional)
                </label>
                <Input
                  placeholder="Ex: Entregue testado na frente do cliente..."
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrderForDelivery(null)}
                  className="rounded-xl text-xs h-9"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 px-4"
                >
                  Confirmar Baixa & Entregar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && orderToReopen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Reabertura de Ordem de Serviço
            </h3>
            <p className="text-xs text-slate-500">
              A ordem <strong>{orderToReopen.order_number}</strong> voltará ao status "Em Andamento" e seus itens retornarão à bancada técnica.
            </p>

            <form onSubmit={handleConfirmReopen} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Motivo da Reabertura *
                </label>
                <Input
                  required
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowReopenModal(false)} className="rounded-xl text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs">
                  Confirmar Reabertura
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Excluir Ordem de Serviço {orderToDelete.order_number}?
            </h3>
            <p className="text-xs text-slate-500">
              Esta ação removerá permanentemente a comanda e todos os itens vinculados.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(false)} className="rounded-xl text-xs">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleConfirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs">
                Sim, Excluir Permanentemente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EntriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Carregando ordens de serviço...</div>}>
      <EntriesListContent />
    </Suspense>
  );
}
