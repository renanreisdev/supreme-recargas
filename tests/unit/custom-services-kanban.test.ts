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

  describe('6. Workflow States / Kanban Situations Customization CRUD', () => {
    it('creates, edits, reorders, and deletes custom Kanban columns', () => {
      // 1. Add new state
      const newState = AppStore.addWorkflowState(tenantId, {
        workflow_id: 'default-workflow',
        name: 'Aguardando Peça Externa',
        code: 'AGUARDANDO_PECA',
        color: 'rose',
        stage_type: 'EM_ANDAMENTO',
        sort_order: 99,
        is_initial: false,
        is_final: false
      });

      expect(newState.id).toBeDefined();
      expect(newState.name).toBe('Aguardando Peça Externa');
      expect(AppStore.getWorkflowStates(tenantId).some(s => s.id === newState.id)).toBe(true);

      // 2. Update state
      const updated = AppStore.updateWorkflowState(newState.id, {
        name: 'Aguardando Componente SMD',
        color: 'amber'
      });
      expect(updated.name).toBe('Aguardando Componente SMD');
      expect(updated.color).toBe('amber');

      // 3. Reorder states
      const allStates = AppStore.getWorkflowStates(tenantId);
      const reversedIds = allStates.map(s => s.id).reverse();
      const reordered = AppStore.reorderWorkflowStates(tenantId, reversedIds);
      expect(reordered[0].id).toBe(reversedIds[0]);

      // 4. Delete state
      AppStore.deleteWorkflowState(newState.id);
      expect(AppStore.getWorkflowStates(tenantId).some(s => s.id === newState.id)).toBe(false);
    });
  });

  describe('7. Category-Linked Checklists', () => {
    it('supports customizable checklist items directly per category', () => {
      const catWithChecklist = AppStore.addCategory({
        tenant_id: tenantId,
        name: 'Notebooks Gamers & Ultrabooks',
        slug: 'notebooks-gamers',
        identifier_label: 'Nº de Série / Service Tag',
        inspection_type: 'CHECKLIST',
        checklist_items: [
          'Liga normalmente e dá vídeo',
          'Teclado e Touchpad 100% funcionais',
          'Carregador Original 135W incluso'
        ],
        is_active: true
      });

      expect(catWithChecklist.checklist_items).toHaveLength(3);
      expect(catWithChecklist.checklist_items![0]).toBe('Liga normalmente e dá vídeo');

      const updated = AppStore.updateCategory(catWithChecklist.id, {
        checklist_items: ['Liga normalmente', 'Sem riscos na tela']
      });
      expect(updated.checklist_items).toHaveLength(2);

      AppStore.deleteCategory(catWithChecklist.id);
    });
  });

  describe('8. SKU & Internal Code Generation Engine', () => {
    it('generates sequential SKUs when mode is AUTO_INCREMENT and returns empty when MANUAL', () => {
      // 1. Manual mode test
      AppStore.updateSettings(tenantId, {
        sku_mode: 'MANUAL'
      });
      expect(AppStore.getNextSku(tenantId)).toBe('');

      // 2. Auto-increment mode test with default settings
      AppStore.updateSettings(tenantId, {
        sku_mode: 'AUTO_INCREMENT',
        sku_prefix: 'MOD-',
        sku_start_number: 100,
        sku_digits: 4
      });

      const nextSku = AppStore.getNextSku(tenantId);
      expect(nextSku).toBe('MOD-0100');

      // 3. Add model and check next sequential SKU
      const model = AppStore.addModel({
        tenant_id: tenantId,
        category_id: 'cat-notebooks',
        name: 'Dell Inspiron 15',
        internal_code: 'MOD-0100',
        is_active: true
      });

      const nextSkuAfter = AppStore.getNextSku(tenantId);
      expect(nextSkuAfter).toBe('MOD-0101');

      // Clean up model
      AppStore.deleteModel(model.id);
    });
  });

  describe('9. Category Dynamic Custom Optionals & Specifications', () => {
    it('manages custom fields with options and description composition flag', () => {
      const cat = AppStore.addCategory({
        tenant_id: tenantId,
        name: 'Impressoras Térmicas Não Fiscais',
        slug: 'impressoras-termicas',
        inspection_type: 'CHECKLIST',
        custom_fields: [
          {
            id: 'f-1',
            name: 'Interface de Comunicação',
            type: 'select',
            options: ['USB + Serial', 'Ethernet (Rede)', 'Wi-Fi / Bluetooth'],
            include_in_description: true
          },
          {
            id: 'f-2',
            name: 'Largura da Bobina',
            type: 'select',
            options: ['58mm', '80mm'],
            include_in_description: true
          }
        ],
        is_active: true
      });

      expect(cat.custom_fields).toHaveLength(2);
      expect(cat.custom_fields![0].name).toBe('Interface de Comunicação');
      expect(cat.custom_fields![0].include_in_description).toBe(true);
      expect(cat.custom_fields![0].options).toContain('Ethernet (Rede)');

      AppStore.deleteCategory(cat.id);
    });
  });
});

