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

  describe('10. Category Custom Technical Verdicts & Custom Inspection Types', () => {
    it('stores and retrieves category custom verdicts and inspection types', () => {
      const cat = AppStore.addCategory({
        tenant_id: tenantId,
        name: 'Drones & Estabilizadores',
        slug: 'drones',
        inspection_type: 'CUSTOM',
        inspection_type_label: 'Voo de Teste & Calibração de Giroscópio',
        technical_verdicts: [
          'Calibração e Motores 100% OK',
          'Gimbal Danificado',
          'ESC Queimado / Sem Reparo'
        ],
        custom_fields: [
          {
            id: 'f-1',
            name: 'Alcance do Rádio',
            type: 'number',
            unit: 'km',
            include_in_description: true
          },
          {
            id: 'f-2',
            name: 'Possui Câmera 4K',
            type: 'checkbox',
            include_in_description: true
          }
        ],
        is_active: true
      });

      expect(cat.technical_verdicts).toHaveLength(3);
      expect(cat.technical_verdicts).toContain('Gimbal Danificado');
      expect(cat.inspection_type_label).toBe('Voo de Teste & Calibração de Giroscópio');
      expect(cat.custom_fields![0].unit).toBe('km');
      expect(cat.custom_fields![1].type).toBe('checkbox');

      AppStore.deleteCategory(cat.id);
    });
  });

  describe('11. Batch Updating Model Descriptions from Ordered Custom Fields', () => {
    it('composes full model description using space-separated ordered custom fields', () => {
      const cat = AppStore.addCategory({
        tenant_id: tenantId,
        name: 'Cartuchos Especiais',
        slug: 'cartuchos-especiais',
        inspection_type: 'SCALE',
        custom_fields: [
          { id: 'f-1', name: 'Cor', type: 'select', include_in_description: true },
          { id: 'f-2', name: 'Versão', type: 'select', include_in_description: true },
          { id: 'f-3', name: 'Capacidade', type: 'number', unit: 'ml', include_in_description: true }
        ],
        is_active: true
      });

      const model = AppStore.addModel({
        tenant_id: tenantId,
        category_id: cat.id,
        name: 'HP 664',
        custom_attributes: {
          'Cor': 'Tricolor',
          'Versão': 'Versão XL (Alta Capacidade)',
          'Capacidade': '32'
        },
        is_active: true
      });

      const parts = [model.name];
      cat.custom_fields!.forEach(f => {
        if (f.include_in_description && model.custom_attributes?.[f.name]) {
          const val = model.custom_attributes[f.name];
          parts.push(f.unit ? `${val}${f.unit}` : String(val));
        }
      });
      const composed = parts.join(' ').replace(/\s+/g, ' ').trim();

      expect(composed).toBe('HP 664 Tricolor Versão XL (Alta Capacidade) 32ml');
      expect(composed).not.toContain(' - ');

      AppStore.deleteModel(model.id);
      AppStore.deleteCategory(cat.id);
    });
  });

  describe('12. Item Description Display Mode Configuration', () => {
    it('saves and retrieves item_description_display_mode in company settings', () => {
      // 1. Set to BASIC
      AppStore.updateSettings(tenantId, {
        item_description_display_mode: 'BASIC'
      });
      let settings = AppStore.getSettings(tenantId);
      expect(settings.item_description_display_mode).toBe('BASIC');

      // 2. Set to FULL
      AppStore.updateSettings(tenantId, {
        item_description_display_mode: 'FULL'
      });
      settings = AppStore.getSettings(tenantId);
      expect(settings.item_description_display_mode).toBe('FULL');
    });
  });

  describe('13. Kanban Item Drag & Drop State Transition', () => {
    it('moves item to another workflow stage smoothly', () => {
      const order = AppStore.addServiceOrder({
        tenant_id: tenantId,
        customer_id: 'cust-001',
        opened_by: 'usr-admin',
        opened_by_name: 'Admin',
        items: [
          {
            model_id: 'mod-hp664-black',
            internal_identifier: 'TEST-DRAG-01',
            services: [
              {
                service_id: 'srv-refill',
                quantity: 1,
                unit_price: 25.0
              }
            ]
          }
        ]
      });

      expect(order.items).toBeDefined();
      expect(order.items!.length).toBeGreaterThan(0);
      const itemId = order.items![0].id;
      expect(order.items![0].status).toBe('RECEBIDO');

      // Drag and drop onto 'EM_RECARGA'
      const updated = AppStore.updateOrderItemStatus(itemId, {
        status: 'EM_RECARGA',
        current_state_id: 'state-002',
        technical_notes: 'Movido via arrastar e soltar no Kanban'
      });

      expect(updated.status).toBe('EM_RECARGA');
      expect(updated.current_state_id).toBe('state-002');

      // Drag and drop onto 'TESTES'
      const updatedTests = AppStore.updateOrderItemStatus(itemId, {
        status: 'TESTES',
        current_state_id: 'state-003'
      });
      expect(updatedTests.status).toBe('TESTES');
    });
  });

  describe('14. Partial Payment Discount on Delivery', () => {
    it('applies discount difference when authorized user confirms partial payment liquidation', () => {
      const order = AppStore.addServiceOrder({
        tenant_id: tenantId,
        customer_id: 'cust-001',
        opened_by: 'usr-admin',
        opened_by_name: 'Admin',
        items: [
          {
            model_id: 'mod-hp664-black',
            internal_identifier: 'ID-DISC-01',
            services: [
              {
                service_id: 'srv-refill',
                quantity: 1,
                unit_price: 100.0
              }
            ]
          }
        ]
      });

      expect(order.total_amount).toBe(100.0);
      expect(order.remaining_amount).toBe(100.0);

      // Customer pays R$ 80.00 and R$ 20.00 is applied as discount
      const delivered = AppStore.deliverServiceOrder(order.id, {
        receiver_name: 'Juliana Ferreira',
        payments: [{ payment_method: 'PIX', amount: 80.0 }],
        apply_discount: 20.0
      }, 'Atendente');

      expect(delivered.status).toBe('ENTREGUE');
      expect(delivered.total_amount).toBe(80.0);
      expect(delivered.paid_amount).toBe(80.0);
      expect(delivered.discount_amount).toBe(20.0);
      expect(delivered.remaining_amount).toBe(0);
      expect(delivered.financial_status).toBe('PAGO');
    });
  });

  describe('15. Zero-Value Delivery with Mandatory Justification', () => {
    it('delivers with 100% discount and records mandatory justification notes', () => {
      const order = AppStore.addServiceOrder({
        tenant_id: tenantId,
        customer_id: 'cust-001',
        opened_by: 'usr-admin',
        opened_by_name: 'Admin',
        items: [
          {
            model_id: 'mod-hp664-black',
            internal_identifier: 'ID-ZERO-01',
            services: [
              {
                service_id: 'srv-refill',
                quantity: 1,
                unit_price: 50.0
              }
            ]
          }
        ]
      });

      const justification = '[BAIXA ZERADA / CORTESIA]: Retrabalho em garantia autorizado pela gerência';
      expect(justification.length).toBeGreaterThanOrEqual(10);

      const delivered = AppStore.deliverServiceOrder(order.id, {
        receiver_name: 'Carlos Alberto',
        payments: [],
        apply_discount: 50.0,
        notes: justification
      }, 'Gerente');

      expect(delivered.status).toBe('ENTREGUE');
      expect(delivered.total_amount).toBe(0);
      expect(delivered.remaining_amount).toBe(0);
      expect(delivered.discount_amount).toBe(50.0);
      expect(delivered.financial_status).toBe('PAGO');
      expect(delivered.delivery_info?.notes).toContain('Retrabalho em garantia');
    });
  });

  describe('16. Zero-Value Delivery Flag explicitly zeroes comanda total and financial amounts', () => {
    it('sets total_amount to 0, remaining_amount to 0 and paid_amount to 0 when is_zero_value is passed', () => {
      const order = AppStore.addServiceOrder({
        tenant_id: tenantId,
        customer_id: 'cust-001',
        opened_by: 'usr-admin',
        opened_by_name: 'Admin',
        items: [
          {
            model_id: 'mod-hp664-black',
            internal_identifier: 'ID-ZERO-FLAG-01',
            services: [
              {
                service_id: 'srv-refill',
                quantity: 2,
                unit_price: 60.0
              }
            ]
          }
        ]
      });

      expect(order.subtotal_amount).toBe(120.0);
      expect(order.total_amount).toBe(120.0);

      const delivered = AppStore.deliverServiceOrder(order.id, {
        receiver_name: 'Marcos Vinicius',
        is_zero_value: true,
        notes: '[BAIXA ZERADA / CORTESIA]: Isenção autorizada pela diretoria comercial'
      }, 'Gerente');

      expect(delivered.status).toBe('ENTREGUE');
      expect(delivered.total_amount).toBe(0);
      expect(delivered.paid_amount).toBe(0);
      expect(delivered.remaining_amount).toBe(0);
      expect(delivered.discount_amount).toBe(120.0);
      expect(delivered.financial_status).toBe('PAGO');
    });
  });

  describe('17. User and Permission Group Max Discount Limit Hierarchy', () => {
    it('resolves default discount from group and overrides with custom user discount', () => {
      // 1. Create a custom permission group with 15% discount limit
      const customGroup = AppStore.addPermissionGroup({
        tenant_id: tenantId,
        name: 'Supervisores de Loja',
        description: 'Supervisores com alçada especial de desconto',
        default_role: 'ATENDENTE',
        default_max_discount_percent: 15,
        permissions: {
          apply_discount_on_delivery: true,
          allow_zero_value_delivery: false
        }
      });

      // 2. Create user assigned to this group without custom discount
      const user = AppStore.addUser({
        tenant_id: tenantId,
        full_name: 'Lucas Supervisor',
        email: 'lucas@supreme.com.br',
        role: 'ATENDENTE',
        group_id: customGroup.id,
        is_active: true
      });

      expect(AppStore.getUserMaxDiscountPercent(user.id)).toBe(15);

      // 3. Update user with custom discount limit of 25%
      AppStore.updateUserPermissions(user.id, { apply_discount_on_delivery: true }, 'Admin', 25);
      expect(AppStore.getUserMaxDiscountPercent(user.id)).toBe(25);

      // Clean up
      AppStore.deletePermissionGroup(customGroup.id);
    });
  });

  describe('18. Responsible Technician Assignment on Service Order Entry', () => {
    it('creates service order with assigned technician and propagates to items', () => {
      const order = AppStore.addServiceOrder({
        tenant_id: tenantId,
        customer_id: 'cust-001',
        opened_by: 'usr-attendant',
        opened_by_name: 'Mariana Santos',
        assigned_technician_id: 'usr-tech-01',
        assigned_technician_name: 'Rafael Técnico',
        items: [
          {
            model_id: 'mod-hp664-black',
            internal_identifier: 'HP-TECH-01',
            services: [
              {
                service_id: 'srv-refill',
                quantity: 1,
                unit_price: 35.0
              }
            ]
          }
        ]
      });

      expect(order.assigned_technician_id).toBe('usr-tech-01');
      expect(order.assigned_technician_name).toBe('Rafael Técnico');
      expect(order.items?.[0].assigned_technician_id).toBe('usr-tech-01');
      expect(order.items?.[0].assigned_technician_name).toBe('Rafael Técnico');
    });
  });

  describe('19. Technician Claiming and Reassigning Kanban Items', () => {
    it('allows claiming unassigned item and reassigning to another technician', () => {
      // 1. Create order without technician
      const order = AppStore.addServiceOrder({
        tenant_id: tenantId,
        customer_id: 'cust-001',
        opened_by: 'usr-attendant',
        opened_by_name: 'Mariana Santos',
        items: [
          {
            model_id: 'mod-hp664-black',
            internal_identifier: 'HP-CLAIM-01',
            services: [
              {
                service_id: 'srv-refill',
                quantity: 1,
                unit_price: 35.0
              }
            ]
          }
        ]
      });

      const itemId = order.items![0].id;
      expect(order.items![0].assigned_technician_id).toBeUndefined();

      // 2. Technician claims the item
      const claimed = AppStore.assignOrderItemTechnician(itemId, 'usr-tech-rafael', 'Rafael Souza', 'Rafael Souza');
      expect(claimed.assigned_technician_id).toBe('usr-tech-rafael');
      expect(claimed.assigned_technician_name).toBe('Rafael Souza');

      // 3. Manager reassigns the item to another technician
      const reassigned = AppStore.assignOrderItemTechnician(itemId, 'usr-tech-lucas', 'Lucas Lima', 'Admin');
      expect(reassigned.assigned_technician_id).toBe('usr-tech-lucas');
      expect(reassigned.assigned_technician_name).toBe('Lucas Lima');
    });
  });
});

