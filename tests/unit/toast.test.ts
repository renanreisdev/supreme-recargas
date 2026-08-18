import { describe, it, expect, beforeEach } from 'vitest';
import { toast, showToast, TOAST_EVENT } from '@/lib/toast';

describe('Global Toast System', () => {
  beforeEach(() => {
    // Setup window mock in node test environment
    if (typeof window === 'undefined') {
      const eventTarget = new EventTarget();
      (globalThis as any).window = eventTarget;
      (globalThis as any).CustomEvent = class CustomEvent extends Event {
        detail: any;
        constructor(type: string, options?: any) {
          super(type, options);
          this.detail = options?.detail;
        }
      };
    }
  });

  it('dispatches custom event on window when showToast is called', () => {
    let capturedDetail: any = null;
    const handler = (e: Event) => {
      capturedDetail = (e as CustomEvent).detail;
    };

    window.addEventListener(TOAST_EVENT, handler);

    showToast('Item salvo com sucesso!', 'success', 'Sucesso');

    expect(capturedDetail).toBeDefined();
    expect(capturedDetail.message).toBe('Item salvo com sucesso!');
    expect(capturedDetail.type).toBe('success');
    expect(capturedDetail.title).toBe('Sucesso');

    window.removeEventListener(TOAST_EVENT, handler);
  });

  it('provides convenient helper methods for error, warning, and info', () => {
    let capturedDetail: any = null;
    const handler = (e: Event) => {
      capturedDetail = (e as CustomEvent).detail;
    };

    window.addEventListener(TOAST_EVENT, handler);

    toast.error('Erro ao salvar informações.');
    expect(capturedDetail.type).toBe('error');
    expect(capturedDetail.message).toBe('Erro ao salvar informações.');

    toast.warning('Atenção aos campos obrigatórios.');
    expect(capturedDetail.type).toBe('warning');
    expect(capturedDetail.message).toBe('Atenção aos campos obrigatórios.');

    toast.info('Item reaberto.');
    expect(capturedDetail.type).toBe('info');
    expect(capturedDetail.message).toBe('Item reaberto.');

    window.removeEventListener(TOAST_EVENT, handler);
  });
});
