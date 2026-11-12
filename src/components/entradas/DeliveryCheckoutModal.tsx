'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  X, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import { ServiceOrder, PaymentMethod, Profile } from '@/types';
import { AppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DialogModal, DialogModalProps } from '@/components/ui/dialog-modal';
import { toast } from '@/lib/toast';

export interface DeliveryCheckoutModalProps {
  order: ServiceOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: Profile | null;
  canAllowZeroValue: boolean;
  canApplyDiscount: boolean;
  autoPrintOnDelivery?: boolean;
  printDeliveryCopies?: number;
}

export function DeliveryCheckoutModal({
  order,
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  canAllowZeroValue,
  canApplyDiscount,
  autoPrintOnDelivery = false,
  printDeliveryCopies = 1
}: DeliveryCheckoutModalProps) {
  const [receiverName, setReceiverName] = useState('');
  const [receiverDoc, setReceiverDoc] = useState('');
  const [receiverRelation, setReceiverRelation] = useState('Próprio Cliente');
  const [payments, setPayments] = useState<Array<{ id: string; method: PaymentMethod; amount: number }>>([]);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Zero Value Delivery Justification State
  const [showZeroValueModal, setShowZeroValueModal] = useState(false);
  const [zeroValueReason, setZeroValueReason] = useState('');

  // Dialog Modal for warnings and confirmations
  const [dialogModal, setDialogModal] = useState<DialogModalProps | null>(null);

  useEffect(() => {
    if (order && isOpen) {
      setReceiverName(order.customer?.name || '');
      setReceiverDoc(order.customer?.document || '');
      setReceiverRelation('Próprio Cliente');
      setDeliveryNotes('');
      setShowZeroValueModal(false);
      setZeroValueReason('');

      const remainingToPay = Math.max(0, order.total_amount - (order.paid_amount || 0));
      setPayments([
        {
          id: `pay-${Date.now()}-1`,
          method: 'PIX',
          amount: remainingToPay
        }
      ]);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const modalRemainingToPay = Math.max(0, order.total_amount - (order.paid_amount || 0));
  const totalPaidSum = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const diff = totalPaidSum - modalRemainingToPay;
  const liveChange = diff > 0 ? diff : 0;
  const liveRemaining = diff < 0 ? Math.abs(diff) : 0;

  const handleAddPaymentLine = () => {
    const currentPaidSum = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const orderRemaining = Math.max(0, order.total_amount - (order.paid_amount || 0));
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

  const executeDelivery = (options: { applyDiscount: number; isZeroValue?: boolean; customNotes?: string }) => {
    try {
      const deliveredId = order.id;
      const orderNum = order.order_number;

      AppStore.deliverServiceOrder(deliveredId, {
        receiver_name: receiverName.trim(),
        receiver_document: receiverDoc.trim(),
        receiver_relation: receiverRelation,
        notes: options.customNotes || deliveryNotes,
        payments: options.isZeroValue 
          ? [] 
          : payments.filter(p => Number(p.amount) > 0).map(p => ({ payment_method: p.method, amount: Number(p.amount) })),
        apply_discount: options.applyDiscount,
        is_zero_value: options.isZeroValue
      }, currentUser?.full_name || 'Atendente');

      toast.success(`Baixa e entrega da OS #${orderNum} concluída com sucesso!`);
      onSuccess();
      onClose();

      if (autoPrintOnDelivery && printDeliveryCopies !== 0) {
        window.open(`/impressao?orderId=${deliveredId}&type=delivery&copies=${printDeliveryCopies || 1}`, '_blank');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Ocorreu um erro inesperado ao salvar a entrega.');
    }
  };

  const handleRegisterDelivery = (e: React.FormEvent) => {
    e.preventDefault();

    // Cenário 1: Valor Zerado (totalPaidSum === 0) e ainda existe saldo a pagar
    if (modalRemainingToPay > 0 && totalPaidSum === 0) {
      if (!canAllowZeroValue) {
        setDialogModal({
          isOpen: true,
          type: 'warning',
          title: 'Permissão Insuficiente',
          subtitle: 'Baixa com valor zerado não autorizada',
          message: 'Seu perfil de usuário não possui a permissão "Dar Baixa com Valor Zerado" (cortesia/isenção total). Solicite autorização a um administrador do sistema.',
          isAlertOnly: true,
          confirmLabel: 'Entendido',
          onConfirm: () => setDialogModal(null)
        });
        return;
      }

      setZeroValueReason('');
      setShowZeroValueModal(true);
      return;
    }

    // Cenário 2: Valor Pago Menor que o Total (0 < totalPaidSum < modalRemainingToPay)
    if (modalRemainingToPay > 0 && totalPaidSum > 0 && totalPaidSum < modalRemainingToPay) {
      const discountAmount = modalRemainingToPay - totalPaidSum;
      const discountPercent = (discountAmount / modalRemainingToPay) * 100;
      const userMaxDiscountPercent = currentUser ? AppStore.getUserMaxDiscountPercent(currentUser.id) : 0;

      if (!canApplyDiscount) {
        setDialogModal({
          isOpen: true,
          type: 'warning',
          title: 'Permissão Insuficiente',
          subtitle: 'Concessão de desconto não autorizada',
          message: `O valor pago (${formatCurrency(totalPaidSum)}) é menor que o saldo (${formatCurrency(modalRemainingToPay)}). Seu perfil não possui permissão para conceder descontos na baixa.`,
          isAlertOnly: true,
          confirmLabel: 'Entendido',
          onConfirm: () => setDialogModal(null)
        });
        return;
      }

      if (discountPercent > userMaxDiscountPercent) {
        setDialogModal({
          isOpen: true,
          type: 'warning',
          title: 'Limite de Desconto Excedido',
          subtitle: `Limite autorizado: ${userMaxDiscountPercent}% • Solicitado: ${discountPercent.toFixed(1)}%`,
          message: `O desconto de ${formatCurrency(discountAmount)} (${discountPercent.toFixed(1)}%) ultrapassa o limite máximo permitido de ${userMaxDiscountPercent}% para o seu usuário. Solicite autorização de um administrador.`,
          isAlertOnly: true,
          confirmLabel: 'Entendido',
          onConfirm: () => setDialogModal(null)
        });
        return;
      }

      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: `Conceder Desconto de ${formatCurrency(discountAmount)}?`,
        subtitle: `Valor pago: ${formatCurrency(totalPaidSum)} • Saldo: ${formatCurrency(modalRemainingToPay)} (${discountPercent.toFixed(1)}% de desconto)`,
        message: `O valor pago (${formatCurrency(totalPaidSum)}) é menor que o total da comanda (${formatCurrency(modalRemainingToPay)}). Deseja aplicar a diferença de ${formatCurrency(discountAmount)} como desconto financeiro e liquidar a comanda?`,
        confirmLabel: 'Sim, Conceder Desconto e Liquidar',
        cancelLabel: 'Cancelar',
        onCancel: () => setDialogModal(null),
        onConfirm: () => {
          setDialogModal(null);
          executeDelivery({
            applyDiscount: discountAmount,
            customNotes: deliveryNotes
          });
        }
      });
      return;
    }

    // Cenário 3: Pagamento integral ou superior
    executeDelivery({
      applyDiscount: 0,
      customNotes: deliveryNotes
    });
  };

  const handleConfirmZeroValueDelivery = (e: React.FormEvent) => {
    e.preventDefault();

    if (zeroValueReason.trim().length < 10) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Motivo Insuficiente',
        subtitle: 'Mínimo de 10 caracteres obrigatório',
        message: 'Por favor, escreva uma justificativa com no mínimo 10 caracteres explicando o motivo da baixa com valor zerado.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }

    const combinedNotes = `[BAIXA ZERADA / CORTESIA]: ${zeroValueReason.trim()}${deliveryNotes.trim() ? ` | ${deliveryNotes.trim()}` : ''}`;
    executeDelivery({
      applyDiscount: modalRemainingToPay,
      isZeroValue: true,
      customNotes: combinedNotes
    });
  };

  return (
    <>
      {dialogModal && <DialogModal {...dialogModal} />}

      {/* Main Delivery Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Entrega & Baixa de Ordem de Serviço</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                OS #{order.order_number} • Cliente: {order.customer?.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleRegisterDelivery} className="space-y-4">
            {/* Receiver Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center mb-1">
                  <span>Nome do Recebedor</span>
                  <span className="text-red-500 font-bold ml-1">*</span>
                </label>
                <Input
                  required
                  placeholder="Quem está retirando..."
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Relação c/ Cliente:
                </label>
                <Select
                  value={receiverRelation}
                  onChange={e => setReceiverRelation(e.target.value)}
                  className="h-10 text-xs rounded-xl"
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

              {payments.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Select
                    value={p.method}
                    onChange={e => handleUpdatePaymentLine(p.id, 'method', e.target.value)}
                    className="h-10 text-xs rounded-xl flex-1"
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
                    className="h-10 text-xs rounded-xl w-28 text-right font-bold"
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
                onClick={onClose}
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

      {/* Zero Value Justification Modal */}
      {showZeroValueModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Baixa com Valor Zerado
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordem nº <strong className="font-mono">{order.order_number}</strong> • Saldo a liquidar: <strong className="text-amber-600">{formatCurrency(modalRemainingToPay)}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Você está concluindo a entrega sem nenhum pagamento informado. É obrigatório registrar o motivo formal (cortesia, garantia de serviço, retrabalho ou acordo comercial).
            </div>

            <form onSubmit={handleConfirmZeroValueDelivery} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Motivo da Baixa Sem Cobrança *
                  </label>
                  <span className={`text-[10px] font-bold ${
                    zeroValueReason.trim().length >= 10 ? 'text-emerald-600' : 'text-rose-500'
                  }`}>
                    {zeroValueReason.trim().length}/10 caracteres (mínimo 10)
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva detalhadamente o motivo (ex: Cortesia concedida pela gerência, retrabalho em garantia...)"
                  value={zeroValueReason}
                  onChange={e => setZeroValueReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowZeroValueModal(false)}
                  className="rounded-xl text-xs h-9"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={zeroValueReason.trim().length < 10}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5 shadow-md shadow-amber-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Baixa Zerada</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
