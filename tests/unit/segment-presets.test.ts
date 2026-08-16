import { describe, it, expect, beforeEach } from 'vitest';
import { AppStore, SEGMENT_PRESETS } from '@/lib/store';
import { BusinessSegment } from '@/types';

describe('Multi-Segment Presets & Extensible Domain Tests', () => {
  beforeEach(() => {
    // Reset or prepare store
  });

  it('should have all 4 business segment presets defined with appropriate metadata', () => {
    const segments = AppStore.getAvailableSegments();
    expect(segments).toHaveLength(4);

    const keys = segments.map(s => s.segment);
    expect(keys).toContain('RECARGA_CARTUCHOS');
    expect(keys).toContain('ASSISTENCIA_CELULARES_INFORMATICA');
    expect(keys).toContain('FERRAMENTAS_MOTORES');
    expect(keys).toContain('OFICINA_GERAL');
  });

  it('should configure RECARGA_CARTUCHOS with scale weight inspection and cartridge labels', () => {
    const config = SEGMENT_PRESETS.RECARGA_CARTUCHOS;
    expect(config.itemLabelSingular).toBe('Cartucho');
    expect(config.itemLabelPlural).toBe('Cartuchos');
    expect(config.identifierLabel).toBe('Final de Série');
    expect(config.serviceLabel).toBe('Serviço Solicitado');
    expect(config.hasWeightInspection).toBe(true);
    expect(config.hasChecklist).toBe(false);
  });

  it('should configure ASSISTENCIA_CELULARES_INFORMATICA with checklist and IMEI/Serial labels', () => {
    const config = SEGMENT_PRESETS.ASSISTENCIA_CELULARES_INFORMATICA;
    expect(config.itemLabelSingular).toBe('Aparelho / Dispositivo');
    expect(config.itemLabelPlural).toBe('Aparelhos');
    expect(config.identifierLabel).toBe('IMEI / Serial');
    expect(config.serviceLabel).toBe('Serviço / Reparo Solicitado');
    expect(config.hasWeightInspection).toBe(false);
    expect(config.hasChecklist).toBe(true);
    expect(config.defaultChecklistItems).toContain('Tela / Vidro Trincado ou Riscos');
    expect(config.defaultChecklistItems).toContain('Bateria / Conector de Carga');
    expect(config.defaultCategories).toContain('Smartphones');
  });

  it('should configure FERRAMENTAS_MOTORES with power tools checklist and serial labels', () => {
    const config = SEGMENT_PRESETS.FERRAMENTAS_MOTORES;
    expect(config.itemLabelSingular).toBe('Equipamento / Máquina');
    expect(config.itemLabelPlural).toBe('Equipamentos');
    expect(config.identifierLabel).toBe('Nº de Série / Tag');
    expect(config.hasWeightInspection).toBe(false);
    expect(config.hasChecklist).toBe(true);
    expect(config.defaultChecklistItems).toContain('Escovas de Carvão / Coletor');
    expect(config.defaultChecklistItems).toContain('Rolamentos & Engrenagens');
    expect(config.defaultCategories).toContain('Furadeiras & Parafusadeiras');
  });

  it('should configure OFICINA_GERAL with multi-purpose checklist', () => {
    const config = SEGMENT_PRESETS.OFICINA_GERAL;
    expect(config.itemLabelSingular).toBe('Item / Peça');
    expect(config.hasChecklist).toBe(true);
    expect(config.defaultChecklistItems).toContain('Estado Geral de Conservação');
    expect(config.defaultCategories).toContain('Geral');
  });

  it('should allow dynamically switching company business segment and update preset', () => {
    const testTenantId = 'test-segment-tenant-' + Date.now();
    AppStore.addCompany({
      id: testTenantId,
      corporate_name: 'Oficina Tech Cell LTDA',
      trade_name: 'Tech Cell Assistência',
      cnpj: '00.000.000/0001-99',
      is_active: true,
      business_segment: 'ASSISTENCIA_CELULARES_INFORMATICA'
    } as any);

    const initialConfig = AppStore.getSegmentConfig(testTenantId);
    expect(initialConfig.segment).toBe('ASSISTENCIA_CELULARES_INFORMATICA');
    expect(initialConfig.hasChecklist).toBe(true);
    expect(initialConfig.itemLabelSingular).toBe('Aparelho / Dispositivo');

    // Switch to FERRAMENTAS_MOTORES
    AppStore.setCompanySegment(testTenantId, 'FERRAMENTAS_MOTORES');
    const updatedConfig = AppStore.getSegmentConfig(testTenantId);
    expect(updatedConfig.segment).toBe('FERRAMENTAS_MOTORES');
    expect(updatedConfig.itemLabelSingular).toBe('Equipamento / Máquina');
  });

  it('should store and preserve custom checklist and accessories on reception entry', () => {
    const testTenantId = 'test-reception-tenant-' + Date.now();
    AppStore.addCompany({
      id: testTenantId,
      corporate_name: 'Eletro Motores SA',
      trade_name: 'Eletro Motores',
      cnpj: '11.111.111/0001-11',
      is_active: true,
      business_segment: 'FERRAMENTAS_MOTORES'
    } as any);

    const customer = AppStore.addCustomer({
      tenant_id: testTenantId,
      name: 'Carlos Construtor',
      phone: '(11) 99999-8888'
    });

    const model = AppStore.addModel({
      tenant_id: testTenantId,
      brand_name: 'Makita',
      model_name: 'Martelete HR2470',
      color: 'Verde/Preto',
      is_xl: false,
      category: 'Marteletes & Demolidores',
      is_active: true
    });

    const entry = AppStore.createEntry({
      tenantId: testTenantId,
      customerId: customer.id,
      paymentMethod: 'PIX',
      items: [
        {
          modelId: model.id,
          finalSerie: 'SERIE-MK-991',
          serviceRequested: 'RECARGA_SIMPLES',
          unitPrice: 150.0,
          finalPrice: 150.0,
          accessories: 'Maleta plástica + 2 brocas SDS Plus',
          checklist: [
            { item: 'Cabo de Força / Plugue', checked: true },
            { item: 'Gatilho / Interruptor', checked: false }
          ]
        }
      ]
    });

    expect(entry).toBeDefined();
    expect(entry.cartridges).toBeDefined();
    expect(entry.cartridges?.length).toBe(1);
    const item = entry.cartridges![0];
    expect(item.accessories).toBe('Maleta plástica + 2 brocas SDS Plus');
    expect(item.checklist).toBeDefined();
    expect(item.checklist?.find(c => c.item === 'Cabo de Força / Plugue')?.checked).toBe(true);

    // Update technician notes and checklist in workbench
    AppStore.updateCartridgeTech({
      cartridgeId: item.id,
      technicianId: 'tech-123',
      status: 'FINALIZADO',
      resultClassification: 'OK',
      technicalNotes: 'Troca de carvão e lubrificação do induzido realizadas.',
      checklist: [
        { item: 'Cabo de Força / Plugue', checked: true },
        { item: 'Gatilho / Interruptor', checked: true }
      ]
    });

    const updated = AppStore.getCartridges(testTenantId).find(c => c.id === item.id);
    expect(updated?.status).toBe('FINALIZADO');
    expect(updated?.technical_notes).toContain('Troca de carvão');
    expect(updated?.checklist?.every(c => c.checked)).toBe(true);
  });
});
