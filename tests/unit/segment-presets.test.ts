import { describe, it, expect } from 'vitest';
import { AppStore, BUSINESS_PRESETS, MOCK_COMPANY_SUPREME } from '@/lib/store';

describe('Multi-Segment Presets & Extensible Domain Tests', () => {
  it('should have all 5 business presets defined with appropriate metadata', () => {
    const keys = Object.keys(BUSINESS_PRESETS);
    expect(keys).toContain('RECARGA_CARTUCHOS');
    expect(keys).toContain('ASSISTENCIA_INFORMATICA');
    expect(keys).toContain('ASSISTENCIA_CELULARES');
    expect(keys).toContain('FERRAMENTAS_MOTORES');
    expect(keys).toContain('OFICINA_GERAL');
  });

  it('should configure RECARGA_CARTUCHOS with ink and toner categories and scale weighing', () => {
    const config = BUSINESS_PRESETS.RECARGA_CARTUCHOS;
    expect(config.categories.some(c => c.slug === 'cartucho-tinta')).toBe(true);
    expect(config.categories.some(c => c.slug === 'toner-laser')).toBe(true);
    expect(config.fieldDefinitions?.some(f => f.field_key === 'input_weight_grams')).toBe(true);
  });

  it('should configure ASSISTENCIA_INFORMATICA with notebook and PC services and checklist', () => {
    const config = BUSINESS_PRESETS.ASSISTENCIA_INFORMATICA;
    expect(config.categories.some(c => c.slug === 'notebook')).toBe(true);
    expect(config.services.some(s => s.code === 'FORMATACAO')).toBe(true);
    expect(Boolean(config.checklist?.items && config.checklist.items.length > 0)).toBe(true);
  });

  it('should allow emitting a multi-item service order with different categories simultaneously', () => {
    const tenantId = MOCK_COMPANY_SUPREME.id;
    const customer = AppStore.addCustomer({
      tenant_id: tenantId,
      name: 'Cliente Segment Presets Test',
      phone: '(11) 98765-0000'
    });
    const models = AppStore.getModels(tenantId);
    const services = AppStore.getServices(tenantId);

    const order = AppStore.addServiceOrder({
      tenant_id: tenantId,
      customer_id: customer.id,
      opened_by: 'usr-admin-demo',
      opened_by_name: 'Balcão Test',
      notes: 'Ordem mista: 1 notebook + 1 cartucho de tinta',
      items: [
        {
          model_id: models[0]?.id || 'mod-test-1',
          internal_identifier: 'NOTE-DELL-88',
          reported_issue: 'Lentidão e superaquecimento',
          services: [
            {
              service_id: services[0]?.id || 'srv-test-1',
              quantity: 1,
              unit_price: 150.00
            }
          ]
        },
        {
          model_id: models[1]?.id || 'mod-test-2',
          internal_identifier: 'HP664-C10',
          reported_issue: 'Sem tinta',
          custom_field_values: {
            input_weight_grams: 28.5
          },
          services: [
            {
              service_id: services[1]?.id || 'srv-test-2',
              quantity: 1,
              unit_price: 35.00
            }
          ]
        }
      ]
    }, 'Balcão Test');

    expect(order.id).toBeDefined();
    expect(order.order_number).toMatch(/^2026-\d{6}$/);
    expect(order.items).toHaveLength(2);
    expect(order.total_amount).toBe(185.00);
    expect(order.financial_status).toBe('PENDENTE');
  });
});
