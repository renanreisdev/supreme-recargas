import { describe, it, expect, beforeEach } from 'vitest';
import { AppStore } from '@/lib/store';
import { MOCK_COMPANY_SUPREME } from '@/lib/store';
import { ServicePrice, KanbanColumnConfig } from '@/types';

describe('Custom Services, Kanban & Financial Report Suite', () => {
  const tenantId = MOCK_COMPANY_SUPREME.id;

  describe('1. Custom Services CRUD', () => {
    it('creates, edits, toggles status, and calculates price for custom service', () => {
      // 1. Add Service
      const created = AppStore.addService(tenantId, {
        title: 'Troca de Tela OLED iPhone 13',
        description: 'Tela original com vedação e TrueTone',
        default_price: 350.00,
        estimated_time_minutes: 45,
        category: 'Smartphones'
      }, 'Admin Demo');

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Troca de Tela OLED iPhone 13');
      expect(created.default_price).toBe(350.00);
      expect(created.is_active).toBe(true);

      // 2. Fetch list
      const services = AppStore.getServices(tenantId);
      expect(services.some(s => s.id === created.id)).toBe(true);

      // 3. Price calculation with custom service
      const calc = AppStore.calculateItemPrice(tenantId, '01000000-0000-0000-0000-000000000001', created.id);
      expect(calc.finalPrice).toBe(350.00);
      expect(calc.explanation).toContain('Troca de Tela OLED iPhone 13');

      // 4. Update service
      const updated = AppStore.updateService(created.id, {
        default_price: 320.00
      }, 'Admin Demo');
      expect(updated.default_price).toBe(320.00);

      // 5. Toggle active status
      const toggled = AppStore.toggleServiceStatus(created.id, 'Admin Demo');
      expect(toggled.is_active).toBe(false);

      // 6. Delete service
      const deleted = AppStore.deleteService(created.id, 'Admin Demo');
      expect(deleted).toBe(true);
      expect(AppStore.getServices(tenantId).some(s => s.id === created.id)).toBe(false);
    });
  });

  describe('2. Kanban Personalization & Movement', () => {
    it('customizes columns and moves items between stages', () => {
      const initialCols = AppStore.getKanbanColumns(tenantId);
      expect(initialCols.length).toBeGreaterThanOrEqual(3);

      // Save custom columns
      const customCols: KanbanColumnConfig[] = [
        { id: 'c1', title: 'Triagem & Orçamento', color: 'indigo', statuses: ['RECEBIDO', 'AGUARDANDO_VERIFICACAO'] },
        { id: 'c2', title: 'Execução Técnica', color: 'purple', statuses: ['EM_RECARGA', 'AGUARDANDO_RECARGA'] },
        { id: 'c3', title: 'Controle de Qualidade', color: 'teal', statuses: ['EM_TESTE', 'AGUARDANDO_TESTE'] },
        { id: 'c4', title: 'Finalizado & Liberado', color: 'emerald', statuses: ['FINALIZADO', 'ENTREGUE'] }
      ];

      AppStore.saveKanbanColumns(tenantId, customCols, 'Admin Demo');
      const retrieved = AppStore.getKanbanColumns(tenantId);
      expect(retrieved.length).toBe(4);
      expect(retrieved[0].title).toBe('Triagem & Orçamento');
      expect(retrieved[0].color).toBe('indigo');

      // Move a cartridge status
      const cartridges = AppStore.getCartridges(tenantId);
      expect(cartridges.length).toBeGreaterThan(0);
      const targetCart = cartridges[0];

      const moved = AppStore.moveCartridgeStatus(targetCart.id, 'FINALIZADO', 'Técnico Rafael', 'Aprovado em teste 100%');
      expect(moved.status).toBe('FINALIZADO');
    });
  });

  describe('3. Financial Entries & Calculations', () => {
    it('has populated entries and accurate financial sum', () => {
      const entries = AppStore.getEntries(tenantId);
      expect(entries.length).toBeGreaterThanOrEqual(3);

      const paid = entries.filter(e => e.payment_status === 'PAGO');
      const pending = entries.filter(e => e.payment_status === 'PENDENTE');

      expect(paid.length).toBeGreaterThan(0);
      expect(pending.length).toBeGreaterThan(0);

      const totalReceived = paid.reduce((acc, curr) => acc + curr.total_amount, 0);
      expect(totalReceived).toBeGreaterThanOrEqual(195.00);

      const totalPending = pending.reduce((acc, curr) => acc + curr.total_amount, 0);
      expect(totalPending).toBeGreaterThanOrEqual(80.00);
    });
  });
});
