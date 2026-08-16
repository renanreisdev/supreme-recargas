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
  X
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { CartridgeEntry, PaymentMethod, PaymentStatus, PaymentSplit } from '@/types';
import { formatCurrency, formatDateTime, getPaymentMethodLabel, getPaymentStatusBadge, getStatusBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

function EntriesListContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [entries, setEntries] = useState<CartridgeEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'DELIVERED' | 'PROCESSING'>('ALL');
  
  // Delivery Checkout Modal State
  const [selectedEntryForDelivery, setSelectedEntryForDelivery] = useState<CartridgeEntry | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverDoc, setReceiverDoc] = useState('');
  const [receiverRelation, setReceiverRelation] = useState('Próprio Cliente');
  const [payments, setPayments] = useState<Array<{ id: string; method: PaymentMethod; amount: number }>>([]);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // Uncompleted & Discount Options in Delivery Modal
  const [hasUncompletedCartridges, setHasUncompletedCartridges] = useState(false);
  const [forcedCloseReason, setForcedCloseReason] = useState('Desistência do Cliente');
  const [discountOption, setDiscountOption] = useState<'SALDO_PENDENTE' | 'CONCEDER_DESCONTO'>('SALDO_PENDENTE');

  // Reopen Modal State
  const [entryToReopen, setEntryToReopen] = useState<CartridgeEntry | null>(null);
  const [reopenReason, setReopenReason] = useState('Cliente solicitou reteste/retrabalho');
  const [showReopenModal, setShowReopenModal] = useState(false);

  // Delete Modal State
  const [entryToDelete, setEntryToDelete] = useState<CartridgeEntry | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Notification
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canRegisterDelivery = hasPermission('register_delivery');
  const canCloseUncompleted = hasPermission('close_uncompleted_entry');
  const canApplyDiscount = hasPermission('apply_discount_on_delivery');
  const canReopenEntry = hasPermission('reopen_entry');
  const canDeleteEntry = hasPermission('delete_entry');

  const loadData = () => {
    const data = AppStore.getEntries(currentCompany.id);
    setEntries(data);
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

  // Permission Guard for view_entries
  if (!hasPermission('view_entries')) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
          <ClipboardList className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Acesso Restrito às Entradas & Entregas</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Seu usuário não possui permissão para visualizar a lista geral de comandas e atendimentos. Solicite ao Administrador o ajuste no painel da empresa.
        </p>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button className="bg-slate-900 text-white font-bold">Voltar ao Painel</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Open Delivery Checkout Modal with Multi-Payment Initial State & Uncompleted Check
  const handleOpenDeliveryModal = (entry: CartridgeEntry) => {
    const hasUncompleted = entry.cartridges?.some(c => 
      ['RECEBIDO', 'AGUARDANDO_VERIFICACAO', 'EM_VERIFICACAO', 'AGUARDANDO_RECARGA', 'EM_RECARGA', 'AGUARDANDO_TESTE', 'EM_TESTE'].includes(c.status)
    ) || false;

    if (hasUncompleted && !canCloseUncompleted) {
      alert('Esta comanda possui cartuchos em andamento na oficina técnica. Você não possui a permissão de "Encerrar Comanda sem Conclusão Técnica / Desistência". Solicite a liberação ao administrador nas configurações da empresa.');
      return;
    }

    setHasUncompletedCartridges(hasUncompleted);
    setForcedCloseReason('Desistência do Cliente');
    setDiscountOption('SALDO_PENDENTE');
    setSelectedEntryForDelivery(entry);
    setReceiverName(entry.customer?.name || '');
    setReceiverDoc(entry.customer?.document || '');
    setReceiverRelation('Próprio Cliente');
    setDeliveryNotes('');

    // Initialize with 1 payment line of entry total
    setPayments([
      {
        id: `pay-${Date.now()}-1`,
        method: entry.payment_method || 'PIX',
        amount: entry.total_amount
      }
    ]);
  };

  // Payment Lines Handlers
  const handleAddPaymentLine = () => {
    if (!selectedEntryForDelivery) return;
    const currentTotalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const remaining = Math.max(0, selectedEntryForDelivery.total_amount - currentTotalPaid);

    setPayments([
      ...payments,
      {
        id: `pay-${Date.now()}-${payments.length + 1}`,
        method: 'DINHEIRO',
        amount: remaining
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

  // Live Multi-Payment Calculations
  const modalTotal = selectedEntryForDelivery ? selectedEntryForDelivery.total_amount : 0;
  const totalPaidSum = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const diff = totalPaidSum - modalTotal;
  const liveChange = diff > 0 ? diff : 0;
  const liveRemaining = diff < 0 ? Math.abs(diff) : 0;
  const isUnderpaid = liveRemaining > 0;

  // Submit Delivery & Payment (Baixa Financeira)
  const handleRegisterDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryForDelivery) return;

    if (hasUncompletedCartridges && !canCloseUncompleted) {
      alert('Operação cancelada: você não possui permissão para encerrar comandas com cartuchos não concluídos.');
      return;
    }

    if (isUnderpaid && discountOption === 'CONCEDER_DESCONTO' && !canApplyDiscount) {
      alert('Você não possui permissão para conceder descontos na baixa. O administrador precisa liberar esta permissão nas configurações.');
      return;
    }

    const primaryMethod = payments[0]?.method || 'DINHEIRO';
    const isAPrazoOnly = payments.every(p => p.method === 'A_PRAZO');
    const shouldApplyDiscount = isUnderpaid && discountOption === 'CONCEDER_DESCONTO';

    const paymentStatus: PaymentStatus = shouldApplyDiscount
      ? 'PAGO'
      : isAPrazoOnly || liveRemaining > 0 
        ? 'PENDENTE' 
        : 'PAGO';

    try {
      AppStore.registerDeliveryAndPayment({
        entryId: selectedEntryForDelivery.id,
        attendantId: currentUser.id,
        attendantName: currentUser.full_name,
        receiverName: receiverName.trim(),
        receiverDocument: receiverDoc.trim(),
        receiverRelation: receiverRelation,
        paymentMethod: primaryMethod,
        paymentStatus: paymentStatus,
        payments: payments.map(p => ({ method: p.method, amount: p.amount })),
        amountPaid: totalPaidSum,
        changeAmount: liveChange,
        remainingAmount: shouldApplyDiscount ? 0 : liveRemaining,
        notes: deliveryNotes,
        applyDiscountDifference: shouldApplyDiscount,
        forcedCloseReason: hasUncompletedCartridges ? forcedCloseReason : undefined
      });

      loadData();
      setSelectedEntryForDelivery(null);
      setActionAlert({ 
        type: 'success', 
        message: `Baixa da comanda concluída com sucesso! ${shouldApplyDiscount ? `(Desconto de R$ ${liveRemaining.toFixed(2)} aplicado)` : ''}` 
      });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      alert(`Erro ao registrar baixa: ${err?.message || 'Erro inesperado'}`);
    }
  };

  // Reopen Entry Handlers
  const handleOpenReopenModal = (entry: CartridgeEntry) => {
    if (!canReopenEntry) {
      alert('Seu usuário não possui permissão para reabrir comandas. Solicite ao Administrador.');
      return;
    }
    setEntryToReopen(entry);
    setReopenReason('Cliente solicitou reteste ou retrabalho técnico');
    setShowReopenModal(true);
  };

  const handleConfirmReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryToReopen) return;
    try {
      AppStore.reopenEntry(entryToReopen.id, reopenReason, currentUser?.full_name || 'Administrador');
      loadData();
      setShowReopenModal(false);
      setEntryToReopen(null);
      setActionAlert({ type: 'success', message: `Comanda ${entryToReopen.entry_number} reaberta com sucesso no sistema!` });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      alert(`Erro ao reabrir comanda: ${err?.message || 'Erro inesperado'}`);
    }
  };

  // Delete Entry Handlers
  const handleOpenDeleteModal = (entry: CartridgeEntry) => {
    if (!canDeleteEntry) {
      alert('Seu usuário não possui permissão para excluir comandas. Solicite ao Administrador.');
      return;
    }
    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!entryToDelete) return;
    try {
      AppStore.deleteEntry(entryToDelete.id, currentUser?.full_name || 'Administrador');
      loadData();
      setShowDeleteModal(false);
      const num = entryToDelete.entry_number;
      setEntryToDelete(null);
      setActionAlert({ type: 'success', message: `Comanda ${num} excluída permanentemente com sucesso!` });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      alert(`Erro ao excluir comanda: ${err?.message || 'Erro inesperado'}`);
    }
  };

  // Search & Filter
  const filteredEntries = entries.filter(e => {
    const matchesSearch = 
      e.entry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.customer?.name && e.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.customer?.phone && e.customer.phone.includes(searchTerm)) ||
      (e.customer?.secondary_phone && e.customer.secondary_phone.includes(searchTerm)) ||
      (e.cartridges && e.cartridges.some(c => c.serial_number.includes(searchTerm) || c.final_serie.toLowerCase().includes(searchTerm.toLowerCase())));

    if (!matchesSearch) return false;

    const isDelivered = e.cartridges?.every(c => c.status === 'ENTREGUE');
    const isReady = !isDelivered && e.cartridges?.some(c => c.status === 'FINALIZADO');

    if (statusFilter === 'READY') return isReady;
    if (statusFilter === 'DELIVERED') return isDelivered;
    if (statusFilter === 'PROCESSING') return !isDelivered && !isReady;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {actionAlert && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 ${
          actionAlert.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{actionAlert.message}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActionAlert(null)} className="h-6 w-6 p-0">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            <span>Atendimentos & Entradas de Cartuchos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento de comandas, conferência de status, baixa financeira e entrega de cartuchos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('create_entry') && (
            <Link href="/entradas/nova">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold gap-1.5 shadow-sm text-white h-9">
                <PlusCircle className="w-4 h-4" />
                <span>Nova Entrada</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por N° comanda, cliente, fone ou série..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 text-xs rounded font-semibold transition-all ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Todos ({entries.length})
              </button>
              <button
                onClick={() => setStatusFilter('READY')}
                className={`px-3 py-1.5 text-xs rounded font-semibold transition-all ${statusFilter === 'READY' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
              >
                Prontos ({entries.filter(e => !e.cartridges?.every(c => c.status === 'ENTREGUE') && e.cartridges?.some(c => c.status === 'FINALIZADO')).length})
              </button>
              <button
                onClick={() => setStatusFilter('PROCESSING')}
                className={`px-3 py-1.5 text-xs rounded font-semibold transition-all ${statusFilter === 'PROCESSING' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
              >
                Em Andamento ({entries.filter(e => !e.cartridges?.every(c => c.status === 'ENTREGUE') && !e.cartridges?.some(c => c.status === 'FINALIZADO')).length})
              </button>
              <button
                onClick={() => setStatusFilter('DELIVERED')}
                className={`px-3 py-1.5 text-xs rounded font-semibold transition-all ${statusFilter === 'DELIVERED' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Entregues ({entries.filter(e => e.cartridges?.every(c => c.status === 'ENTREGUE')).length})
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                <tr>
                  <th className="p-3 rounded-l-lg">Comanda / Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Cartuchos / Modelos</th>
                  <th className="p-3">Valor Total</th>
                  <th className="p-3">Pagamento</th>
                  <th className="p-3">Status Geral</th>
                  <th className="p-3 rounded-r-lg text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEntries.map(entry => {
                  const isDelivered = entry.cartridges?.every(c => c.status === 'ENTREGUE');
                  const isReady = !isDelivered && entry.cartridges?.some(c => c.status === 'FINALIZADO');
                  const payBadge = getPaymentStatusBadge(entry.payment_status);

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {entry.entry_number}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateTime(entry.entry_date)}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {entry.customer?.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {entry.customer?.phone}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="space-y-1">
                          {entry.cartridges?.map(c => {
                            const badge = getStatusBadgeConfig(c.status);
                            return (
                              <div key={c.id} className="flex items-center gap-1.5 text-[11px]">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {c.model?.model_name || 'Cartucho'}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                  (Série: {c.final_serie || 'S/N'})
                                </span>
                                <span className={`px-1.5 py-0.2 text-[9px] rounded font-bold ${badge.className}`}>
                                  {badge.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(entry.total_amount)}
                        </div>
                        {entry.discount_amount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Desc: -{formatCurrency(entry.discount_amount)}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${payBadge.className}`}>
                          {payBadge.label}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {entry.payments && entry.payments.length > 1 ? (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Dividido ({entry.payments.length} formas)
                            </span>
                          ) : (
                            getPaymentMethodLabel(entry.payment_method)
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        {isDelivered ? (
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-100 font-semibold">
                              Entregue
                            </span>
                            {entry.delivery_info && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Retirado por: <strong>{entry.delivery_info.receiver_name}</strong>
                              </p>
                            )}
                          </div>
                        ) : isReady ? (
                          <Badge className="bg-emerald-600 text-white font-bold">PRONTO P/ RETIRADA</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-300">EM BANCADA</Badge>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Print Receipt */}
                          <Link href={`/impressao?entry=${entry.entry_number}`}>
                            <Button size="sm" variant="outline" className="h-7 text-[11px] px-2 gap-1 font-semibold" title="Imprimir Comanda">
                              <Printer className="w-3.5 h-3.5" />
                              <span>Comanda</span>
                            </Button>
                          </Link>

                          {/* Delivery & Checkout (if not delivered) */}
                          {!isDelivered && (canRegisterDelivery || canCloseUncompleted) && (
                            <Button 
                              size="sm" 
                              onClick={() => handleOpenDeliveryModal(entry)}
                              className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-sm"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Baixa & Entrega</span>
                            </Button>
                          )}

                          {/* Reopen Entry (if delivered and has permission) */}
                          {isDelivered && canReopenEntry && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReopenModal(entry)}
                              className="h-7 text-[11px] px-2 gap-1 font-semibold text-amber-700 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              title="Reabrir comanda para reprocessamento"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span>Reabrir</span>
                            </Button>
                          )}

                          {/* Delete Entry (if has permission) */}
                          {canDeleteEntry && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDeleteModal(entry)}
                              className="h-7 text-[11px] px-2 gap-1 font-semibold text-rose-700 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Excluir comanda permanentemente"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Excluir</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                      Nenhum atendimento ou comanda encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Professional Multi-Payment Delivery Checkout Modal */}
      {selectedEntryForDelivery && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Baixa Financeira & Entrega de Cartuchos</h3>
                  <p className="text-[11px] text-slate-400">
                    Comanda: <strong className="text-white font-mono">{selectedEntryForDelivery.entry_number}</strong> — Cliente: {selectedEntryForDelivery.customer?.name}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedEntryForDelivery(null)} className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRegisterDelivery} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Uncompleted Cartridges Warning / Desistência */}
              {hasUncompletedCartridges && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Cartuchos Não Finalizados na Bancada (Encerramento Antecipado)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Esta comanda contém itens em andamento na oficina. Como você possui permissão para <strong>Encerrar por Desistência</strong>, os itens serão baixados como Devolvidos ao cliente.
                  </p>
                  <div>
                    <label className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 mb-0.5 block">
                      Motivo da Baixa / Desistência *
                    </label>
                    <Select
                      value={forcedCloseReason}
                      onChange={(e) => setForcedCloseReason(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-900"
                    >
                      <option value="Desistência do Cliente">Desistência do Cliente (Retirada antes do reparo)</option>
                      <option value="Devolução sem serviço">Devolução sem serviço (Cliente não aguardou)</option>
                      <option value="Cliente não aprovou orçamento">Cliente não aprovou orçamento</option>
                      <option value="Equipamento incompatível">Equipamento incompatível</option>
                      <option value="Outro motivo">Outro motivo operacional</option>
                    </Select>
                  </div>
                </div>
              )}

              {/* Financial Summary Card */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Valor Total da Comanda:</p>
                  <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(selectedEntryForDelivery.total_amount)}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-500">Cartuchos:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEntryForDelivery.cartridges?.length} itens</p>
                </div>
              </div>

              {/* Multi-Payment Methods Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Formas de Pagamento Recebidas</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPaymentLine}
                    className="text-[11px] h-7 gap-1 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Outra Forma</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  {payments.map((p, pIdx) => (
                    <div key={p.id} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <Select
                          value={p.method}
                          onChange={(e) => handleUpdatePaymentLine(p.id, 'method', e.target.value as PaymentMethod)}
                          className="text-xs font-semibold"
                        >
                          <option value="PIX">⚡ PIX Instantâneo</option>
                          <option value="DINHEIRO">💵 Dinheiro em Espécie</option>
                          <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
                          <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
                          <option value="A_PRAZO">📝 A Prazo / Faturado</option>
                          <option value="ISENTO">🎁 Isento / Garantia</option>
                        </Select>
                      </div>

                      <div className="w-32">
                        <Input
                          type="number"
                          step="0.50"
                          required
                          value={p.amount}
                          onChange={(e) => handleUpdatePaymentLine(p.id, 'amount', e.target.value)}
                          className="text-xs font-bold text-slate-900 dark:text-slate-100"
                          placeholder="Valor R$"
                        />
                      </div>

                      {payments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentLine(p.id)}
                          className="text-rose-600 hover:text-rose-800 p-1.5"
                          title="Remover forma de pagamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Calculation Indicator: Troco ou Valor Menor / Desconto */}
                <div className="pt-1 space-y-2">
                  {liveChange > 0 && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">Troco a Devolver ao Cliente:</span>
                      <strong className="text-sm text-emerald-900 dark:text-emerald-200">
                        {formatCurrency(liveChange)}
                      </strong>
                    </div>
                  )}

                  {/* Underpaid / Valor Menor: Prompt for Discount vs Pending Balance */}
                  {isUnderpaid && (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Valor informado menor que o total ({formatCurrency(totalPaidSum)} de {formatCurrency(modalTotal)}):</span>
                        </span>
                        <strong className="text-sm font-extrabold text-rose-600">
                          Diferença: {formatCurrency(liveRemaining)}
                        </strong>
                      </div>

                      <div className="space-y-2 text-xs pt-1 border-t border-amber-200 dark:border-amber-800/80">
                        {/* Option A: Keep as Pending Balance */}
                        <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400">
                          <input
                            type="radio"
                            name="discount_decision"
                            checked={discountOption === 'SALDO_PENDENTE'}
                            onChange={() => setDiscountOption('SALDO_PENDENTE')}
                            className="mt-0.5 text-amber-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              Manter {formatCurrency(liveRemaining)} como Saldo Devedor / A Prazo
                            </span>
                            <span className="text-[11px] text-slate-500">
                              A comanda ficará com status <strong>PENDENTE</strong> até o recebimento do restante.
                            </span>
                          </div>
                        </label>

                        {/* Option B: Apply Discount to Settle Comanda */}
                        <label className={`flex items-start gap-2 p-2 rounded-lg border transition-all ${
                          !canApplyDiscount 
                            ? 'bg-slate-100 dark:bg-slate-850 opacity-60 cursor-not-allowed border-slate-300' 
                            : 'bg-white dark:bg-slate-900 cursor-pointer hover:border-emerald-500'
                        }`}>
                          <input
                            type="radio"
                            name="discount_decision"
                            disabled={!canApplyDiscount}
                            checked={discountOption === 'CONCEDER_DESCONTO'}
                            onChange={() => setDiscountOption('CONCEDER_DESCONTO')}
                            className="mt-0.5 text-emerald-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <Percent className="w-3.5 h-3.5" />
                                <span>Conceder Desconto de {formatCurrency(liveRemaining)} e Quitar Comanda</span>
                              </span>
                              {!canApplyDiscount && (
                                <Badge variant="secondary" className="text-[9px] bg-slate-200 text-slate-600 gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> Sem Permissão
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {canApplyDiscount 
                                ? 'A comanda será quitada como 100% PAGA, registrando o abatimento como desconto.' 
                                : 'Requer permissão de "Conceder Desconto na Baixa" liberada pelo Administrador nas configurações.'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {liveChange === 0 && liveRemaining === 0 && (
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-center text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                      ✓ Valor Total Exato Quitado
                    </div>
                  )}
                </div>
              </div>

              {/* Who Received the cartridge (Quem Retirou) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Quem está retirando os cartuchos? *
                  </label>
                  {selectedEntryForDelivery.customer?.name && (
                    <button
                      type="button"
                      onClick={() => {
                        setReceiverName(selectedEntryForDelivery.customer?.name || '');
                        setReceiverDoc(selectedEntryForDelivery.customer?.document || '');
                        setReceiverRelation('Próprio Cliente');
                      }}
                      className="text-[11px] text-emerald-600 hover:underline font-semibold"
                    >
                      Preencher com dados do cliente
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 mb-0.5 block">Nome do Recebedor *</label>
                    <Input
                      required
                      placeholder="Nome completo de quem retirou"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 mb-0.5 block">Parentesco / Relação</label>
                    <Select
                      value={receiverRelation}
                      onChange={(e) => setReceiverRelation(e.target.value)}
                      className="text-xs"
                    >
                      <option value="Próprio Cliente">Próprio Cliente</option>
                      <option value="Funcionário / Portador">Funcionário / Portador</option>
                      <option value="Familiar">Familiar (Cônjuge / Filho / etc)</option>
                      <option value="Motoboy / Entrega">Motoboy / Entrega</option>
                      <option value="Outro">Outro</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 mb-0.5 block">Documento / RG / CPF (Opcional)</label>
                  <Input
                    placeholder="Documento de identificação"
                    value={receiverDoc}
                    onChange={(e) => setReceiverDoc(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] text-slate-500 mb-0.5 block">Observações da Entrega</label>
                <Input
                  placeholder="Ex: Cartuchos testados e entregues na caixa com comprovante..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedEntryForDelivery(null)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-md text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirmar Baixa & Concluir Entrega</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Entry Confirmation Modal */}
      {showReopenModal && entryToReopen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Reabrir Comanda</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowReopenModal(false)} className="h-8 w-8 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Deseja reabrir a comanda <strong className="text-slate-900 dark:text-slate-100 font-mono">#{entryToReopen.entry_number}</strong> do cliente <strong>{entryToReopen.customer?.name}</strong>? A comanda voltará para a fila de atendimento e o status de pagamento retornará a Pendente.
            </p>

            <form onSubmit={handleConfirmReopen} className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">
                  Motivo da Reabertura *
                </label>
                <Input
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Ex: Cliente retornou para reteste ou retrabalho..."
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowReopenModal(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirmar Reabertura</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Entry Confirmation Modal */}
      {showDeleteModal && entryToDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Excluir Comanda</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowDeleteModal(false)} className="h-8 w-8 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1">
              <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
                Atenção: Ação permanente e irreversível!
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
                Tem certeza que deseja excluir definitivamente a comanda <strong className="font-mono">#{entryToDelete.entry_number}</strong> e seus <strong>{entryToDelete.cartridges?.length || 0} cartuchos</strong>? Esta ação será registrada no histórico de auditoria.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowDeleteModal(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={handleConfirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1 shadow-sm">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Definitivamente</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EntriesListPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Carregando lista de atendimentos...</div>}>
      <EntriesListContent />
    </Suspense>
  );
}
