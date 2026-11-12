'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { ServiceOrder } from '@/types';
import { AppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

export interface DeleteOrderModalProps {
  order: ServiceOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userName?: string;
}

export function DeleteOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
  userName = 'Atendente'
}: DeleteOrderModalProps) {
  if (!isOpen || !order) return null;

  const handleConfirmDelete = () => {
    try {
      const orderNum = order.order_number;
      AppStore.deleteServiceOrder(order.id, userName);
      toast.info(`Ordem de serviço #${orderNum} excluída com sucesso.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível excluir a ordem de serviço.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          Excluir Ordem de Serviço {order.order_number}?
        </h3>
        <p className="text-xs text-slate-500">
          Esta ação removerá permanentemente a comanda e todos os itens vinculados.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose} 
            className="rounded-xl text-xs"
          >
            Cancelar
          </Button>
          <Button 
            size="sm" 
            onClick={handleConfirmDelete} 
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
          >
            Sim, Excluir Permanentemente
          </Button>
        </div>
      </div>
    </div>
  );
}
