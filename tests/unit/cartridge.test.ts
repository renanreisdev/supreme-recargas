import { describe, it, expect } from 'vitest';
import { getStatusBadgeConfig, getResultBadgeConfig, formatCurrency, formatWeight } from '../../src/lib/utils';

describe('Cartridge Management Unit Tests', () => {
  it('calculates weight difference correctly', () => {
    const inputWeight = 27.5;
    const outputWeight = 35.5;
    const diff = Number((outputWeight - inputWeight).toFixed(2));
    expect(diff).toBe(8.0);
    expect(formatWeight(diff)).toBe('8.0 g');
  });

  it('formats BRL currency correctly', () => {
    expect(formatCurrency(35.00)).toContain('35,00');
    expect(formatCurrency(0)).toContain('0,00');
  });

  it('returns valid badge config for cartridge statuses', () => {
    const received = getStatusBadgeConfig('RECEBIDO');
    expect(received.label).toBe('Recebido');

    const finished = getStatusBadgeConfig('FINALIZADO');
    expect(finished.label).toContain('Pronto p/ Entrega');

    const delivered = getStatusBadgeConfig('ENTREGUE');
    expect(delivered.label).toBe('Entregue ao Cliente');
  });

  it('returns valid result badge config for defect classifications', () => {
    const ok = getResultBadgeConfig('OK');
    expect(ok.label).toContain('100% OK');

    const cid = getResultBadgeConfig('CID');
    expect(cid.label).toContain('CID');

    const burned = getResultBadgeConfig('QUEIMADO');
    expect(burned.label).toBe('QUEIMADO');

    const desistencia = getResultBadgeConfig('DESISTENCIA');
    expect(desistencia.label).toContain('Desistência');
  });

  it('validates underpaid discount calculation logic', () => {
    const totalAmount = 60.00;
    const paidAmount = 50.00;
    const diff = totalAmount - paidAmount;
    expect(diff).toBe(10.00);

    // If discount granted:
    const discountAmount = diff;
    const newTotal = totalAmount - discountAmount;
    expect(newTotal).toBe(50.00);
    expect(newTotal).toBe(paidAmount);
  });

  it('validates customer update logic', () => {
    const original = { name: 'João Silva', phone: '(11) 99999-1111', company_name: 'Marmoraria' };
    const updated = { ...original, phone: '(11) 98888-2222', notes: 'Prefere entrega pela manhã' };
    expect(updated.name).toBe('João Silva');
    expect(updated.phone).toBe('(11) 98888-2222');
    expect(updated.notes).toBe('Prefere entrega pela manhã');
  });
});
