import { describe, it, expect, beforeEach } from 'vitest';
import { AppStore, SYSTEM_MODULES } from '@/lib/store';
import { isPasswordHashed, verifyPassword } from '@/lib/security';

describe('Production Readiness: Tenant Onboarding, Plans & Cash Register Persistence', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('creates company with initial admin (8+ chars password) and persists hashed password', async () => {
    const email = `admin.${Date.now()}@loja-producao.com.br`;
    const company = AppStore.addCompany(
      {
        trade_name: 'Loja Produção Teste',
        corporate_name: 'Loja Produção Teste LTDA',
        cnpj: '12.345.678/0001-99',
        phone: '(11) 97777-6666',
        email
      },
      {
        fullName: 'Carlos Admin',
        email,
        password: 'SenhaForte@2026',
        phone: '(11) 97777-6666'
      },
      AppStore.getPlans()[0]?.id,
      'Auto-Cadastro',
      'ASSISTENCIA_INFORMATICA'
    );

    expect(company.id).toBeDefined();
    expect(company.active_template_keys).toContain('ASSISTENCIA_INFORMATICA');

    const adminUser = AppStore.getUsers(company.id).find(u => u.email === email);
    expect(adminUser).toBeDefined();
    expect(adminUser?.role).toBe('ADMINISTRADOR');
    expect(isPasswordHashed(adminUser?.password || '')).toBe(true);
    expect(verifyPassword('SenhaForte@2026', adminUser?.password || '')).toBe(true);

    // Authenticate via authenticateAsync
    const authRes = await AppStore.authenticateAsync(email, 'SenhaForte@2026', { device: 'Vitest' }, true);
    expect(authRes.user.id).toBe(adminUser?.id);
  });

  it('rejects initial admin creation with password shorter than 8 characters', () => {
    expect(() =>
      AppStore.addCompany(
        { trade_name: 'Loja Senha Curta' },
        {
          fullName: 'Admin',
          email: 'curta@loja.com',
          password: '123456' // 6 chars -> must throw
        }
      )
    ).toThrow(/mínimo 8 caracteres/i);
  });

  it('manages full cash register lifecycle (open, movement, order payment, close)', () => {
    const tenantId = '00000000-0000-0000-0000-000000000001';
    const userId = '11111111-1111-1111-1111-111111111111';

    const session = AppStore.openCashRegister(tenantId, 100, userId, 'Operador Caixa', 'Turno Manhã');
    expect(session.status).toBe('ABERTO');
    expect(session.initial_amount).toBe(100);
    expect(session.movements).toHaveLength(1);
    expect(session.movements[0].type).toBe('ABERTURA');

    // Add suprimento (+50) and sangria (-30)
    AppStore.addCashRegisterMovement(tenantId, 'SUPRIMENTO', 50, 'Troco extra', userId, 'Operador Caixa');
    AppStore.addCashRegisterMovement(tenantId, 'SANGRIA', 30, 'Pagamento fornecedor', userId, 'Operador Caixa');

    // Record cash order payment (+80 DINHEIRO)
    AppStore.recordOrderPaymentToCashRegister(
      tenantId,
      '22222222-2222-2222-2222-222222222222',
      '2026-000099',
      80,
      'DINHEIRO',
      userId,
      'Operador Caixa'
    );

    // Expected cash in drawer: 100 + 50 - 30 + 80 = 200
    const closed = AppStore.closeCashRegister(tenantId, 200, userId, 'Operador Caixa', 'Fechamento exato');
    expect(closed.status).toBe('FECHADO');
    expect(closed.closing_calculated_cash).toBe(200);
    expect(closed.closing_counted_cash).toBe(200);
    expect(closed.closing_difference).toBe(0);
  });

  it('extracts plan modules from features and enforces module visibility per tenant plan', () => {
    const selectedLabels = [
      SYSTEM_MODULES.find(m => m.key === 'balcao_os')!.label,
      SYSTEM_MODULES.find(m => m.key === 'comandas_qr')!.label,
      'Suporte VIP WhatsApp'
    ];
    const extracted = AppStore.extractPlanModules(selectedLabels);
    expect(extracted.moduleKeys).toEqual(['balcao_os', 'comandas_qr']);
    expect(extracted.extraFeatures).toEqual(['Suporte VIP WhatsApp']);

    const customPlan = AppStore.addPlan({
      name: 'Plano Restrito Balcão',
      code: 'RESTRITO_BALCAO',
      description: 'Somente balcão e comandas',
      monthly_price: 49.9,
      max_users: 2,
      extra_user_price: 15,
      features: selectedLabels,
      is_active: true
    });

    const company = AppStore.addCompany(
      { trade_name: 'Loja Módulo Restrito', email: `restrito.${Date.now()}@loja.com` },
      undefined,
      customPlan.id
    );

    expect(AppStore.isModuleEnabledForTenant(company.id, 'balcao_os')).toBe(true);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'comandas_qr')).toBe(true);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'frente_caixa')).toBe(false);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'relatorios_financeiros')).toBe(false);
  });
});

