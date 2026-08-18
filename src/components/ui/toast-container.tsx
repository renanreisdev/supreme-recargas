'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastItem, TOAST_EVENT } from '@/lib/toast';

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        const newToast = customEvent.detail;
        setToasts(prev => {
          // Avoid duplicate identical active messages
          const filtered = prev.filter(t => t.message !== newToast.message || t.type !== newToast.type);
          // Keep max 4 toasts at a time
          const next = [...filtered, newToast].slice(-4);
          return next;
        });

        const duration = newToast.duration || 4000;
        setTimeout(() => {
          removeToast(newToast.id);
        }, duration);
      }
    };

    window.addEventListener(TOAST_EVENT, handleToastEvent);
    return () => window.removeEventListener(TOAST_EVENT, handleToastEvent);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = toast.duration || 4000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.duration]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 animate-in zoom-in-50 duration-200" />,
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      bg: 'bg-white/95 dark:bg-[#0c161d]/95',
      bar: 'bg-emerald-500',
      titleColor: 'text-emerald-950 dark:text-emerald-200',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 animate-in zoom-in-50 duration-200" />,
      border: 'border-rose-500/30 dark:border-rose-500/40',
      bg: 'bg-white/95 dark:bg-[#1a0e14]/95',
      bar: 'bg-rose-500',
      titleColor: 'text-rose-950 dark:text-rose-200',
      badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 animate-in zoom-in-50 duration-200" />,
      border: 'border-amber-500/30 dark:border-amber-500/40',
      bg: 'bg-white/95 dark:bg-[#1a170c]/95',
      bar: 'bg-amber-500',
      titleColor: 'text-amber-950 dark:text-amber-200',
      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500 shrink-0 animate-in zoom-in-50 duration-200" />,
      border: 'border-blue-500/30 dark:border-blue-500/40',
      bg: 'bg-white/95 dark:bg-[#0d1527]/95',
      bar: 'bg-blue-500',
      titleColor: 'text-blue-950 dark:text-blue-200',
      badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
    }
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 ${config.bg} ${config.border} p-3.5 sm:p-4 animate-in fade-in slide-in-from-bottom-4`}
      style={{
        boxShadow:
          toast.type === 'success'
            ? '0 10px 25px -5px rgba(16, 185, 129, 0.15), 0 8px 10px -6px rgba(16, 185, 129, 0.1)'
            : toast.type === 'error'
            ? '0 10px 25px -5px rgba(244, 63, 94, 0.15), 0 8px 10px -6px rgba(244, 63, 94, 0.1)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{config.icon}</div>

        <div className="flex-1 min-w-0 pr-2">
          {toast.title && (
            <h4 className={`text-xs font-black tracking-tight leading-none mb-1 ${config.titleColor}`}>
              {toast.title}
            </h4>
          )}
          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed break-words">
            {toast.message}
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="shrink-0 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full ${config.bar} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
