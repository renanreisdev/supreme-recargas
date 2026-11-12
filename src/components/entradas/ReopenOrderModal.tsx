'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { ServiceOrder } from '@/types';
import { AppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';

export interface ReopenOrderModalProps {
  order: ServiceOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userName?: string;
}

export function ReopenOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
  userName = 'Atendente'
}: ReopenOrderModalProps) {
  const [reopenReason, setReopenReason] = useState('Cliente solicitou reteste/retrabalho na bancada');

  useEffect(() => {
    if (isOpen) {
      setReopenReason('Cliente solicitou reteste/retrabalho na bancada');
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleConfirmReopen = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const orderNum = order.order_number;
      AppStore.reopenServiceOrder(order.id, reopenReason, userName);
      toast.info(`Ordem de serviço #${orderNum} reaberta e enviada à bancada!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível reabrir a ordem de serviço.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-600" />
          Reabertura de Ordem de Serviço
        </h3>
        <p className="text-xs text-slate-500">
          A ordem <strong>{order.order_number}</strong> voltará ao status &ldquo;Em Andamento&rdquo; e seus itens retornarão à bancada técnica.
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
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={onClose} 
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs"
            >
              Confirmar Reabertura
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
