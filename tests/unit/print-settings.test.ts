import { describe, it, expect } from 'vitest';
import {
  AppStore,
  resolveReceiptCopyConfig,
  buildFullReceiptCopyConfig,
  buildCompactReceiptCopyConfig
} from '../../src/lib/store';

describe('Central de Configurações de Impressão & Comandas Térmicas', () => {
  const tenantId = 'comp-supreme-001';

  it('1. Deve carregar configurações de impressão padrão com 2 vias na entrada e 1 via na entrega', () => {
    const settings = AppStore.getSettings(tenantId);
    expect(settings).toBeDefined();
    expect(settings.print_entry_copies).toBe(2);
    expect(settings.print_delivery_copies).toBe(1);
    expect(settings.auto_print_on_entry).toBe(true);
    expect(settings.auto_print_on_delivery).toBe(true);
    expect(settings.printer_paper_width).toBe('80mm');
    expect(settings.show_prices_on_receipt).toBe(true);
    expect(settings.show_qr_code_on_receipt).toBe(true);
  });

  it('2. Deve permitir alterar para 1 via na entrada e desativar impressão automática na entrega', () => {
    const updated = AppStore.updateSettings(tenantId, {
      print_entry_copies: 1,
      print_delivery_copies: 0,
      auto_print_on_delivery: false,
      printer_paper_width: '58mm',
      thermal_paper_width_mm: 58,
      receipt_header: 'TESTE DE CABEÇALHO PERSONALIZADO',
      receipt_footer: 'Garantia legal de 90 dias.',
      receipt_delivery_footer: 'Retirei o aparelho funcionando perfeitamente.'
    }, 'Admin Teste');

    expect(updated.print_entry_copies).toBe(1);
    expect(updated.print_delivery_copies).toBe(0);
    expect(updated.auto_print_on_delivery).toBe(false);
    expect(updated.printer_paper_width).toBe('58mm');
    expect(updated.thermal_paper_width_mm).toBe(58);
    expect(updated.receipt_header).toBe('TESTE DE CABEÇALHO PERSONALIZADO');

    // Verificar persistência
    const reloaded = AppStore.getSettings(tenantId);
    expect(reloaded.print_entry_copies).toBe(1);
    expect(reloaded.print_delivery_copies).toBe(0);
    expect(reloaded.auto_print_on_delivery).toBe(false);
  });

  it('3. Deve registrar auditoria detalhada com as alterações de impressão', () => {
    const logs = AppStore.getAuditLogs(tenantId);
    const lastLog = logs.find(l => l.action === 'ALTERACAO_CONFIGURACOES');
    expect(lastLog).toBeDefined();
    expect(lastLog?.details).toContain('Vias de impressão');
  });

  it('4. Deve permitir alternar exibição de elementos visíveis (QR code, checklist, assinaturas, CNPJ)', () => {
    const updated = AppStore.updateSettings(tenantId, {
      show_qr_code_on_receipt: false,
      show_checklist_on_receipt: true,
      show_accessories_on_receipt: true,
      show_customer_signature_line: true,
      show_attendant_signature_line: true,
      show_company_cnpj: true
    }, 'Admin Teste');

    expect(updated.show_qr_code_on_receipt).toBe(false);
    expect(updated.show_attendant_signature_line).toBe(true);
  });

  it('5. Deve permitir configurar 1ª e 2ª via de forma totalmente independente e persistir individualmente', () => {
    const customCopy1 = buildFullReceiptCopyConfig({
      custom_title: 'VIA DA OFICINA - CONTROLE INTERNO',
      show_qr_code: false,
      show_attendant_signature: true
    });
    const customCopy2 = buildCompactReceiptCopyConfig({
      custom_title: 'VIA COMPLETA DO CLIENTE',
      show_item_services: true,
      show_reported_issue: true,
      show_accessories: true,
      show_qr_code: true,
      show_prices: false
    });

    AppStore.updateSettings(
      tenantId,
      {
        print_entry_copies: 2,
        receipt_copy_1_config: customCopy1,
        receipt_copy_2_config: customCopy2
      },
      'Admin Teste'
    );

    const reloaded = AppStore.getSettings(tenantId);
    const resolved1 = resolveReceiptCopyConfig(reloaded, 1);
    const resolved2 = resolveReceiptCopyConfig(reloaded, 2);

    expect(resolved1.custom_title).toBe('VIA DA OFICINA - CONTROLE INTERNO');
    expect(resolved1.show_qr_code).toBe(false);
    expect(resolved1.show_attendant_signature).toBe(true);
    expect(resolved1.show_prices).toBe(true);

    expect(resolved2.custom_title).toBe('VIA COMPLETA DO CLIENTE');
    expect(resolved2.show_item_services).toBe(true);
    expect(resolved2.show_reported_issue).toBe(true);
    expect(resolved2.show_accessories).toBe(true);
    expect(resolved2.show_qr_code).toBe(true);
    expect(resolved2.show_prices).toBe(false);
  });
});
