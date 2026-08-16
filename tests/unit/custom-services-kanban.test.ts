import { describe, it, expect } from 'vitest';
import { AppStore, MOCK_COMPANY_SUPREME } from '@/lib/store';
import { Service, ServiceOrder } from '@/types';

describe('Custom Services, Kanban & Financial Report Suite', () => {
  const tenantId = MOCK_COMPANY_SUPREME.id;

  describe('1. Generic Services CRUD', () => {
    it('creates, edits, and manages services in catalog', () => {
      // 1. Add Service
      const created = AppStore.addService({
        tenant_id: tenantId,
        name: 'Troca de Tela OLED iPhone 13',
        code: 'TELA_OLED_IPHONE13',
        description: 'Tela original com vedação e TrueTone',
        default_price: 350.00,
        estimated_time_minutes: 45,
        category_ids: ['cat-smartphones'],
        is_active: true
      }, 'Admin Demo');

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Troca de Tela OLED iPhone 13');
      expect(created.default_price).toBe(350.00);
      expect(created.is_active).toBe(true);

      // 2. Fetch list
      const services = AppStore.getServices(tenantId);
      expect(services.some(s => s.id === created.id)).toBe(true);

      // 3. Update service
      const updated = AppStore.updateService(created.id, {
        default_price: 320.00
      }, 'Admin Demo');
      expect(updated.default_price).toBe(320.00);

      // 4. Delete service
      const deleted = AppStore.deleteService(created.id, 'Admin Demo');
      expect(deleted).toBe(true);
      expect(AppStore.getServices(tenantId).some(s => s.id === created.id)).toBe(false);
    });
  });

  describe('2. Kanban & Workflow States', () => {
    it('retrieves dynamic workflow states and moves item status', () => {
      const states = AppStore.getWorkflowStates(tenantId);
      expect(states.length).toBeGreaterThanOrEqual(3);

      const items = AppStore.getCartridges(tenantId);
      expect(items.length).toBeGreaterThan(0);
      const targetItem = items[0];

      const updated = AppStore.updateOrderItemStatus(targetItem.id, {
        status: 'FINALIZADO',
        result_code: 'OK',
        technical_notes: 'Testado e aprovado com sucesso'
      }, 'Técnico Rafael');

      expect(updated.status).toBe('FINALIZADO');
      expect(updated.result_code).toBe('OK');
    });
  });

  describe('3. Financial Orders & Balances', () => {
    it('has populated orders and accurate financial sums', () => {
      const orders = AppStore.getServiceOrders(tenantId);
      expect(orders.length).toBeGreaterThanOrEqual(2);

      const partialOrPending = orders.filter(o => o.financial_status === 'PENDENTE' || o.financial_status === 'PAGO_PARCIAL');
      expect(partialOrPending.length).toBeGreaterThan(0);

      const totalReceived = orders.reduce((acc, curr) => acc + (curr.paid_amount || 0), 0);
      expect(totalReceived).toBeGreaterThanOrEqual(100.00);
    });
  });
});
