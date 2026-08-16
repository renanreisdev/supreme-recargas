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

  describe('4. Category & Brand Customization CRUD', () => {
    it('creates, edits, and deletes user categories and brands', () => {
      // Category
      const cat = AppStore.addCategory({
        tenant_id: tenantId,
        name: 'Motores Industriais Trifásicos',
        slug: 'motores-trifasicos',
        identifier_label: 'Nº de Chassi / Placa',
        inspection_type: 'CHECKLIST',
        is_active: true
      });
      expect(cat.id).toBeDefined();
      expect(AppStore.getCategories(tenantId).some(c => c.id === cat.id)).toBe(true);

      const updatedCat = AppStore.updateCategory(cat.id, { name: 'Motores Trifásicos & Bombas' });
      expect(updatedCat.name).toBe('Motores Trifásicos & Bombas');

      AppStore.deleteCategory(cat.id);
      expect(AppStore.getCategories(tenantId).some(c => c.id === cat.id)).toBe(false);

      // Brand
      const brand = AppStore.addBrand({
        tenant_id: tenantId,
        name: 'Makita Power Tools',
        slug: 'makita',
        is_active: true
      });
      expect(brand.id).toBeDefined();
      expect(AppStore.getBrands(tenantId).some(b => b.id === brand.id)).toBe(true);

      AppStore.deleteBrand(brand.id);
      expect(AppStore.getBrands(tenantId).some(b => b.id === brand.id)).toBe(false);
    });
  });

  describe('5. Model Optionals & Service Price Overrides', () => {
    it('allows defining custom prices per model for specific services', () => {
      const srv = AppStore.getServices(tenantId)[0];
      const standardPrice = srv.default_price;

      const modelWithOverride = AppStore.addModel({
        tenant_id: tenantId,
        category_id: 'cat-test',
        name: 'Cartucho Especial Plotter HP 711',
        is_xl: true,
        empty_weight_grams: 45.0,
        full_weight_grams: 85.0,
        service_prices: {
          [srv.id]: 75.00
        },
        is_active: true
      });

      // Price for standard model
      const normalResolved = AppStore.getServicePriceForModel(srv.id);
      expect(normalResolved).toBe(standardPrice);

      // Price for model with custom override
      const customResolved = AppStore.getServicePriceForModel(srv.id, modelWithOverride.id);
      expect(customResolved).toBe(75.00);
    });
  });
});
