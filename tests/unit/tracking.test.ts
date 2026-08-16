import { describe, it, expect } from 'vitest';
import { AppStore } from '../../src/lib/store';

describe('Public Tracking & Cross-Device Sync', () => {
  it('retrieves local service order by order number', () => {
    const order = AppStore.getServiceOrderByTrackingToken('2026-000001') || AppStore.getServiceOrderById('2026-000001');
    expect(order).toBeDefined();
    expect(order?.order_number).toBe('2026-000001');
    expect(order?.customer).toBeDefined();
    expect(order?.items?.length).toBeGreaterThan(0);
  });

  it('retrieves local service order by tracking token', () => {
    const order = AppStore.getServiceOrderByTrackingToken('tok-recarga-hp664-pinheiro-01');
    expect(order).toBeDefined();
    expect(order?.order_number).toBe('2026-000001');
  });

  it('handles case-insensitive lookup', () => {
    const order = AppStore.getServiceOrderByTrackingToken('TOK-RECARGA-HP664-PINHEIRO-01');
    expect(order).toBeDefined();
    expect(order?.order_number).toBe('2026-000001');
  });

  it('asynchronously retrieves order with getEntryByTokenAsync alias', async () => {
    const order = await AppStore.getEntryByTokenAsync('2026-000002');
    expect(order).toBeDefined();
    expect(order?.order_number).toBe('2026-000002');
    expect(order?.customer?.name).toBe('Juliana Ferreira Mendes');
  });

  it('returns null/falsy for non-existent token', async () => {
    const order = await AppStore.getEntryByTokenAsync('non-existent-token-12345');
    expect(order).toBeFalsy();
  });
});
