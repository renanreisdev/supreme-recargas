'use client';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  created_at: number;
}

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export const TOAST_EVENT = 'supreme_toast_event';

export function showToast(options: ToastOptions | string, type: ToastType = 'success', title?: string) {
  if (typeof window === 'undefined') return;

  let toastData: ToastOptions;
  if (typeof options === 'string') {
    toastData = {
      message: options,
      type: type,
      title: title || (type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : type === 'warning' ? 'Atenção' : 'Informação')
    };
  } else {
    toastData = {
      ...options,
      type: options.type || 'success',
      title: options.title || (options.type === 'error' ? 'Erro' : options.type === 'warning' ? 'Atenção' : options.type === 'info' ? 'Informação' : 'Sucesso')
    };
  }

  const id = toastData.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        id,
        type: toastData.type,
        title: toastData.title,
        message: toastData.message,
        duration: toastData.duration || 4000,
        created_at: Date.now()
      }
    })
  );

  return id;
}

export const toast = {
  success: (message: string, title: string = 'Sucesso', duration?: number) =>
    showToast({ message, title, type: 'success', duration }),
  error: (message: string, title: string = 'Erro', duration?: number) =>
    showToast({ message, title, type: 'error', duration: duration || 5000 }),
  warning: (message: string, title: string = 'Atenção', duration?: number) =>
    showToast({ message, title, type: 'warning', duration: duration || 4500 }),
  info: (message: string, title: string = 'Informação', duration?: number) =>
    showToast({ message, title, type: 'info', duration }),
  show: (options: ToastOptions) => showToast(options)
};
