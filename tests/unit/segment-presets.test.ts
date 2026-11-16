import { describe, it, expect } from 'vitest';
import { AppStore, BUSINESS_PRESETS, MOCK_COMPANY_SUPREME } from '@/lib/store';

describe('Multi-Segment Presets & Extensible Domain Tests', () => {
  it('should have all 6 business presets defined with appropriate metadata including VIDEOGAMES_ELETRONICOS', () => {
    const keys = Object.keys(BUSINESS_PRESETS);
    expect(keys).toContain('RECARGA_CARTUCHOS');
    expect(keys).toContain('ASSISTENCIA_INFORMATICA');
    expect(keys).toContain('ASSISTENCIA_CELULARES');
    expect(keys).toContain('VIDEOGAMES_ELETRONICOS');
    expect(keys).toContain('FERRAMENTAS_MOTORES');
    expect(keys).toContain('OFICINA_GERAL');
    expect(BUSINESS_PRESETS.VIDEOGAMES_ELETRONICOS.services.some(s => s.code === 'TROCA_HDMI')).toBe(true);
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

  it('should start clean company and support multi-segment preset selection, inline overrides and smart merge without duplicates', () => {
    const comp = AppStore.addCompany(
      {
        trade_name: 'Loja Flex Multi-Segmento',
        corporate_name: 'Loja Flex Multi-Segmento LTDA',
        cnpj: '55.666.777/0001-88',
        phone: '(11) 93333-4444',
        email: `flex.${Date.now()}@loja.com.br`
      },
      {
        fullName: 'Marcos Admin',
        email: `flex.${Date.now()}@loja.com.br`,
        password: 'Password@123'
      },
      AppStore.getPlans()[0]?.id,
      'Auto-Cadastro',
      'ASSISTENCIA_INFORMATICA'
    );

    expect(comp.presets_configured_at).toBeUndefined();
    expect(comp.presets_dismissed_at).toBeUndefined();

    // First import combining Notebook (Informática) + Console HDMI (Videogames) with edited service price & custom Kanban label
    const res1 = AppStore.applyPresetSelection(
      comp.id,
      {
        segments: ['ASSISTENCIA_INFORMATICA', 'VIDEOGAMES_ELETRONICOS'],
        categories: [
          { name: 'Notebook', slug: 'notebook', identifier_label: 'Service Tag' },
          { name: 'Console de Videogame', slug: 'console-videogame', identifier_label: 'Nº de Série' }
        ],
        brands: [
          { name: 'Dell', slug: 'dell' },
          { name: 'Sony PlayStation', slug: 'sony-playstation' }
        ],
        services: [
          {
            name: 'Formatação & Otimização Pro',
            code: 'FORMATACAO',
            default_price: 149.90,
            estimated_time_minutes: 90,
            category_slugs: ['notebook']
          },
          {
            name: 'Troca de Conector HDMI (Micro-Solda)',
            code: 'TROCA_HDMI',
            default_price: 299.00,
            estimated_time_minutes: 120,
            category_slugs: ['console-videogame']
          }
        ],
        models: [
          {
            name: 'PlayStation 5 (PS5)',
            internal_code: 'PS5-FAT',
            brand_name: 'Sony PlayStation',
            category_slug: 'console-videogame'
          }
        ],
        workflowStates: [
          {
            code: 'RECEBIDO',
            name: 'Recebido Balcão',
            color: 'slate',
            stage_type: 'RECEBIDO',
            sort_order: 1,
            is_initial: true,
            is_final: false
          },
          {
            code: 'BANCADA_VIP',
            name: 'Bancada Micro-Solda VIP',
            color: 'blue',
            stage_type: 'EM_ANDAMENTO',
            sort_order: 2,
            is_initial: false,
            is_final: false
          }
        ]
      },
      'Marcos Admin'
    );

    expect(res1.addedCategories).toBe(2);
    expect(res1.addedBrands).toBe(2);
    expect(res1.addedServices).toBe(2);
    expect(res1.addedModels).toBe(1);
    expect(res1.addedWorkflowStates).toBe(2);

    const updatedComp = AppStore.getCompany(comp.id);
    expect(updatedComp.presets_configured_at).toBeDefined();
    expect(updatedComp.active_template_keys).toEqual(['ASSISTENCIA_INFORMATICA', 'VIDEOGAMES_ELETRONICOS']);

    const services = AppStore.getServices(comp.id);
    const hdmiSrv = services.find(s => s.code === 'TROCA_HDMI');
    expect(hdmiSrv?.default_price).toBe(299.00);

    const states = AppStore.getWorkflowStates(comp.id);
    expect(states.some(s => s.name === 'Bancada Micro-Solda VIP')).toBe(true);

    // Second import (smart merge): repeats Dell & Notebook, adds Lenovo & Xbox Series S
    const res2 = AppStore.applyPresetSelection(
      comp.id,
      {
        segments: ['ASSISTENCIA_INFORMATICA', 'VIDEOGAMES_ELETRONICOS'],
        categories: [
          { name: 'Notebook', slug: 'notebook' }
        ],
        brands: [
          { name: 'Dell', slug: 'dell' },
          { name: 'Lenovo', slug: 'lenovo' }
        ],
        services: [],
        models: [
          { name: 'PlayStation 5 (PS5)', internal_code: 'PS5-FAT', brand_name: 'Sony PlayStation', category_slug: 'console-videogame' },
          { name: 'Xbox Series S', internal_code: 'XSS', brand_name: 'Microsoft Xbox' }
        ],
        workflowStates: []
      },
      'Marcos Admin'
    );

    expect(res2.skippedCategories).toBe(1);
    expect(res2.addedCategories).toBe(0);
    expect(res2.skippedBrands).toBe(1);
    expect(res2.addedBrands).toBe(1);
    expect(res2.skippedModels).toBe(1);
    expect(res2.addedModels).toBe(1);

    // Replace workflow states option
    AppStore.applyPresetSelection(
      comp.id,
      {
        categories: [],
        brands: [],
        services: [],
        models: [],
        replaceWorkflowStates: true,
        workflowStates: [
          { code: 'NOVO_INICIO', name: 'Entrada Única', color: 'emerald', stage_type: 'RECEBIDO', sort_order: 1, is_initial: true, is_final: false }
        ]
      },
      'Marcos Admin'
    );
    const replacedStates = AppStore.getWorkflowStates(comp.id);
    expect(replacedStates).toHaveLength(1);
    expect(replacedStates[0].code).toBe('NOVO_INICIO');
  });

  it('should record presets_dismissed_at when admin chooses to configure later', () => {
    const comp = AppStore.addCompany(
      { trade_name: 'Loja Adiada Test', email: `adiar.${Date.now()}@loja.com.br` },
      { fullName: 'Admin Adiar', email: `adiar.${Date.now()}@loja.com.br`, password: 'Password@123' }
    );
    const dismissed = AppStore.dismissPresetOnboarding(comp.id, 'Admin Adiar');
    expect(dismissed.presets_dismissed_at).toBeDefined();
    expect(AppStore.getCompany(comp.id).presets_dismissed_at).toBe(dismissed.presets_dismissed_at);
  });

  it('should include comprehensive cartridge models with 4 variations and category custom fields', () => {
    const presetModels = BUSINESS_PRESETS.RECARGA_CARTUCHOS.models;
    const modelNames = presetModels.map(m => m.name);

    // HP 667 variations + additional HP & Canon families
    expect(modelNames).toContain('HP 667 Preto');
    expect(modelNames).toContain('HP 667 Colorido');
    expect(modelNames).toContain('HP 667 Preto XL');
    expect(modelNames).toContain('HP 667 Colorido XL');
    expect(modelNames).toContain('HP 664 Preto XL');
    expect(modelNames).toContain('HP 662 Colorido XL');
    expect(modelNames).toContain('HP 122 Preto XL');
    expect(modelNames).toContain('HP 60 Preto');
    expect(modelNames).toContain('HP 901 Preto XL');
    expect(modelNames).toContain('HP 21 Preto');
    expect(modelNames).toContain('HP 22 Colorido');
    expect(modelNames).toContain('HP 74 Preto');
    expect(modelNames).toContain('HP 75 Colorido XL');
    expect(modelNames).toContain('Canon PG-145 Preto');
    expect(modelNames).toContain('Canon CL-146 Colorido');

    const cartridgeCatPreset = BUSINESS_PRESETS.RECARGA_CARTUCHOS.categories.find(c => c.slug === 'cartucho-tinta');
    expect(cartridgeCatPreset?.custom_fields).toHaveLength(3);
    expect(cartridgeCatPreset?.technical_verdicts?.length).toBeGreaterThanOrEqual(5);

    const comp = AppStore.addCompany(
      { trade_name: 'Recarga Express Test', email: `recarga.${Date.now()}@loja.com.br` },
      { fullName: 'Admin Recarga', email: `recarga.${Date.now()}@loja.com.br`, password: 'Password@123' }
    );

    // Legacy category created without custom_fields gets automatically enriched on read and backfilled on import
    const legacyCat = AppStore.addCategory({
      tenant_id: comp.id,
      name: 'Cartucho de Tinta',
      slug: 'cartucho-tinta',
      is_active: true
    });
    expect(AppStore.getCategories(comp.id).find(c => c.id === legacyCat.id)?.custom_fields).toHaveLength(3);

    const importRes = AppStore.applyPresetSelection(comp.id, {
      categories: [
        {
          name: 'Cartucho de Tinta',
          slug: 'cartucho-tinta',
          inspection_type: 'SCALE',
          custom_fields: cartridgeCatPreset?.custom_fields,
          technical_verdicts: cartridgeCatPreset?.technical_verdicts
        }
      ],
      brands: [{ name: 'HP', slug: 'hp' }],
      services: [],
      models: presetModels
        .filter(m => m.name?.startsWith('HP 667'))
        .map(m => ({
          name: m.name!,
          internal_code: m.internal_code,
          brand_name: m.brand_name,
          category_slug: 'cartucho-tinta',
          description: m.description,
          empty_weight_grams: m.empty_weight_grams,
          full_weight_grams: m.full_weight_grams,
          attributes: m.attributes,
          custom_attributes: m.custom_attributes
        })),
      workflowStates: []
    });

    expect(importRes.addedModels).toBe(4);
    const savedModels = AppStore.getModels(comp.id);
    const hp667Xl = savedModels.find(m => m.name === 'HP 667 Preto XL');
    expect(hp667Xl?.custom_attributes?.['Cor / Tipo de Tinta']).toBe('Preto');
    expect(hp667Xl?.custom_attributes?.['Versão XL / Alta Capacidade']).toBe(true);
    expect(hp667Xl?.custom_attributes?.['Capacidade']).toBe(6.5);
  });
});
