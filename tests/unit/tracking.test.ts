import { describe, it, expect } from 'vitest';
import { AppStore } from '../../src/lib/store';

describe('Public Tracking & Cross-Device Sync', () => {
  const tenantId = 'b2000000-0000-0000-0000-000000000001';
  let testOrder: any;

  it('retrieves local service order by order number', () => {
    const cust = AppStore.addCustomer({ tenant_id: tenantId, name: 'Cliente Rastreamento', phone: '(11) 99999-0000' });
    testOrder = AppStore.addServiceOrder({
      tenant_id: tenantId,
      customer_id: cust.id,
      opened_by: 'd4000000-0000-0000-0000-000000000002',
      items: [{ model_id: 'mod-test', internal_identifier: 'SN-01', services: [] }]
    });

    const order = AppStore.getServiceOrderByTrackingToken(testOrder.order_number) || AppStore.getServiceOrderById(testOrder.id);
    expect(order).toBeDefined();
    expect(order?.order_number).toBe(testOrder.order_number);
    expect(order?.customer).toBeDefined();
  });

  it('retrieves local service order by tracking token', () => {
    const order = AppStore.getServiceOrderByTrackingToken(testOrder.tracking_token);
    expect(order).toBeDefined();
    expect(order?.order_number).toBe(testOrder.order_number);
  });

  it('handles case-insensitive lookup', () => {
    const order = AppStore.getServiceOrderByTrackingToken(testOrder.tracking_token.toUpperCase());
    expect(order).toBeDefined();
    expect(order?.order_number).toBe(testOrder.order_number);
  });

  it('asynchronously retrieves order with getEntryByTokenAsync alias', async () => {
    const order = await AppStore.getEntryByTokenAsync(testOrder.tracking_token);
    expect(order).toBeDefined();
    expect(order?.order_number).toBe(testOrder.order_number);
    expect(order?.customer?.name).toBe('Cliente Rastreamento');
  });

  it('returns null/falsy for non-existent token', async () => {
    const order = await AppStore.getEntryByTokenAsync('non-existent-token-12345');
    expect(order).toBeFalsy();
  });
});
