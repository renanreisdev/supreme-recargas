'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DialogModalProps {
  isOpen: boolean;
  type?: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  subtitle?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isAlertOnly?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function DialogModal({
  isOpen,
  type = 'warning',
  title,
  subtitle,
  message,
  confirmLabel,
  cancelLabel,
  isAlertOnly,
  onConfirm,
  onCancel
}: DialogModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
        <div className="flex items-center gap-3.5">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0",
            type === 'danger'
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              : type === 'info'
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                : type === 'success'
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          )}>
            {type === 'danger' ? (
              <Trash2 className="w-6 h-6" />
            ) : type === 'info' ? (
              <Info className="w-6 h-6" />
            ) : type === 'success' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          {!isAlertOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-xs font-semibold"
            >
              {cancelLabel || 'Cancelar'}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className={cn(
              "text-xs font-bold text-white",
              type === 'danger'
                ? "bg-rose-600 hover:bg-rose-700"
                : type === 'info'
                  ? "bg-blue-600 hover:bg-blue-700"
                  : type === 'success'
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
            )}
          >
            {confirmLabel || (isAlertOnly ? 'Entendido' : 'Confirmar')}
          </Button>
        </div>
      </div>
    </div>
  );
}
