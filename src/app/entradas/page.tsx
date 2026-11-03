'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ClipboardList, 
  Search, 
  Printer, 
  PackageCheck, 
  PlusCircle, 
  RotateCcw, 
  Trash2, 
  X, 
  Phone, 
  QrCode,
  MessageCircle 
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { ServiceOrder, CompanySettings } from '@/types';
import { formatCurrency, formatDateTime, getPaymentStatusBadge, getStatusBadgeConfig } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DialogModal, DialogModalProps } from '@/components/ui/dialog-modal';
import { DeliveryCheckoutModal } from '@/components/entradas/DeliveryCheckoutModal';
import { ReopenOrderModal } from '@/components/entradas/ReopenOrderModal';
import { DeleteOrderModal } from '@/components/entradas/DeleteOrderModal';

function EntriesListContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'DELIVERED' | 'PROCESSING'>('ALL');
  
  // Modal selection states
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<ServiceOrder | null>(null);
  const [orderToReopen, setOrderToReopen] = useState<ServiceOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);

  // Notification and Dialog Modals
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [dialogModal, setDialogModal] = useState<DialogModalProps | null>(null);

  const canApplyDiscount = hasPermission('apply_discount_on_delivery') || hasPermission('orders_discount') || currentUser?.role === 'ADMINISTRADOR';
  const canAllowZeroValue = hasPermission('allow_zero_value_delivery') || currentUser?.role === 'ADMINISTRADOR';
  const canReopenEntry = hasPermission('reopen_entry') || hasPermission('orders_reopen') || currentUser?.role === 'ADMINISTRADOR';
  const canDeleteEntry = hasPermission('delete_entry') || hasPermission('orders_cancel') || currentUser?.role === 'ADMINISTRADOR';

  const loadData = () => {
    const data = AppStore.getServiceOrders(currentCompany.id);
    const sets = AppStore.getSettings(currentCompany.id);
    setOrders(data);
    setSettings(sets);
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

  const handleSendWhatsAppOrder = (order: ServiceOrder) => {
    const rawPhone = order.customer?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      return;
    }
    const waNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://supremerecargas.com.br';
    const trackingUrl = `${origin}/acompanhar/${order.tracking_token || order.id}`;
    const custName = order.customer?.name || 'Cliente';

    const isDelivered = order.status === 'ENTREGUE';
    const isCompleted = order.status === 'PRONTA';

    let message = '';
    if (isDelivered) {
      message = `Olá, *${custName}*!\n\nConfirmamos a entrega da sua OS *#${order.order_number}* na *${currentCompany.trade_name}*.\n\n` +
        `Agradecemos a confiança e preferência! Caso precise de suprimentos ou novos serviços, estamos à disposição.`;
    } else if (isCompleted) {
      message = `Olá, *${custName}*!\n\nSua Ordem de Serviço *#${order.order_number}* está *PRONTA PARA RETIRADA* na *${currentCompany.trade_name}*!\n\n` +
        `💰 *Valor Total:* ${formatCurrency(order.total_amount)}\n` +
        `🔍 *Acompanhe pelo link:*\n${trackingUrl}\n\n` +
        `Aguardamos você para a retirada!`;
    } else {
      message = `Olá, *${custName}*!\n\nAtualização sobre sua Ordem de Serviço *#${order.order_number}* na *${currentCompany.trade_name}*.\n\n` +
        `🔍 *Acompanhe o andamento em tempo real:*\n${trackingUrl}\n\n` +
        `Qualquer dúvida, estamos à disposição!`;
    }

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
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
            className="pl-9 h-10 text-xs rounded-xl"
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
                  const isDelivered = order.status === 'ENTREGUE';
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
                        {order.assigned_technician_name && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Téc:</span>
                            <span className="truncate">{order.assigned_technician_name}</span>
                          </div>
                        )}
                      </td>

                      {/* Items Summary */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          {order.items?.map((it, i) => {
                            const itemDisplayName = settings.item_description_display_mode === 'FULL'
                              ? (it.model?.description || it.model?.name || 'Item')
                              : (it.model?.name || 'Item');

                            return (
                              <div key={i} className="text-[11px] text-slate-700 dark:text-slate-300 truncate">
                                <span className="font-semibold text-slate-900 dark:text-white">{itemDisplayName}</span>
                                <span className="font-mono text-slate-400 ml-1">({it.internal_identifier})</span>
                              </div>
                            );
                          })}
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
                        {!isDelivered && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedOrderForDelivery(order)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-xl px-2.5 shadow-sm"
                          >
                            <PackageCheck className="w-3.5 h-3.5 mr-1" />
                            <span>Baixa / Entrega</span>
                          </Button>
                        )}

                        {isDelivered && canReopenEntry && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setOrderToReopen(order)}
                            className="text-amber-600 border-amber-300 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs h-8 rounded-xl px-2"
                            title="Reabrir Ordem"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Link href={`/impressao?orderId=${order.id}&type=${isDelivered ? 'delivery' : 'entry'}&copies=${isDelivered ? (settings.print_delivery_copies || 1) : (settings.print_entry_copies || 2)}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 rounded-xl px-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600"
                            title={isDelivered ? 'Imprimir Comprovante de Entrega' : 'Imprimir Comanda'}
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

                        {order.customer?.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendWhatsAppOrder(order)}
                            className="text-xs h-8 rounded-xl px-2 text-emerald-600 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Enviar atualização no WhatsApp do cliente"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {canDeleteEntry && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setOrderToDelete(order)}
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

      {/* Modular Delivery Checkout Modal */}
      <DeliveryCheckoutModal
        isOpen={!!selectedOrderForDelivery}
        order={selectedOrderForDelivery}
        onClose={() => setSelectedOrderForDelivery(null)}
        onSuccess={loadData}
        currentUser={currentUser}
        canAllowZeroValue={canAllowZeroValue}
        canApplyDiscount={canApplyDiscount}
        autoPrintOnDelivery={settings.auto_print_on_delivery}
        printDeliveryCopies={settings.print_delivery_copies}
      />

      {/* Modular Reopen Order Modal */}
      <ReopenOrderModal
        isOpen={!!orderToReopen}
        order={orderToReopen}
        onClose={() => setOrderToReopen(null)}
        onSuccess={loadData}
        userName={currentUser?.full_name}
      />

      {/* Modular Delete Order Modal */}
      <DeleteOrderModal
        isOpen={!!orderToDelete}
        order={orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onSuccess={loadData}
        userName={currentUser?.full_name}
      />
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
