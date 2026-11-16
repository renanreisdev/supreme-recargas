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

  it('computes SaaS executive overview KPIs including MRR, ARR, ARPU and distributions', () => {
    const paidPlan = AppStore.getPlans().find(p => p.monthly_price > 0) || AppStore.getPlans()[0];
    AppStore.addCompany(
      {
        trade_name: 'Loja MRR Alpha',
        corporate_name: 'Loja MRR Alpha LTDA',
        cnpj: '33.444.555/0001-01',
        phone: '(11) 95555-1111',
        email: 'alpha@mrrteste.com.br'
      },
      {
        fullName: 'Alpha Admin',
        email: 'alpha@mrrteste.com.br',
        password: 'Password@123'
      },
      paidPlan.id,
      'Super Admin',
      'ASSISTENCIA_CELULARES'
    );

    const overview = AppStore.getPlatformOverview();
    expect(overview.totalCompanies).toBeGreaterThanOrEqual(1);
    expect(overview.activeCompanies).toBeGreaterThanOrEqual(1);
    expect(overview.totalUsers).toBeGreaterThanOrEqual(1);
    expect(overview.totalARR).toBeCloseTo(overview.totalMRR * 12, 2);
    expect(overview.arpu).toBeCloseTo(overview.activeCompanies > 0 ? overview.totalMRR / overview.activeCompanies : 0, 2);
    expect(Array.isArray(overview.planDistribution)).toBe(true);
    expect(Array.isArray(overview.segmentDistribution)).toBe(true);
    expect(overview.segmentDistribution.some(s => s.key === 'ASSISTENCIA_CELULARES')).toBe(true);
  });

  it('renews active subscription and extends trial with cumulative expiration dates', () => {
    const plan = AppStore.getPlans().find(p => p.monthly_price > 0) || AppStore.getPlans()[0];
    const company = AppStore.addCompany(
      {
        trade_name: 'Loja Renovação Test',
        corporate_name: 'Loja Renovação Test LTDA',
        cnpj: '44.555.666/0001-02',
        phone: '(11) 94444-2222',
        email: 'renovacao@teste.com.br'
      },
      {
        fullName: 'Renovacao Admin',
        email: 'renovacao@teste.com.br',
        password: 'Password@123'
      },
      plan.id,
      'Super Admin',
      'RECARGA_CARTUCHOS'
    );

    const beforeExtend = Date.now();
    const trialSub = AppStore.extendTrialSubscription(company.id, 7, 'Super Admin');
    expect(trialSub.status).toBe('TRIAL');
    expect(trialSub.expires_at).toBeDefined();
    const firstExpMs = new Date(trialSub.expires_at!).getTime();
    expect(firstExpMs).toBeGreaterThanOrEqual(beforeExtend + 6 * 86400000);

    const activeSub = AppStore.renewSubscription(company.id, 30, 'Super Admin');
    expect(activeSub.status).toBe('ACTIVE');
    expect(activeSub.expires_at).toBeDefined();
    const renewedExpMs = new Date(activeSub.expires_at!).getTime();
    // Should accumulate ~30 days on top of future trial expiration
    expect(renewedExpMs - firstExpMs).toBeGreaterThanOrEqual(29 * 86400000);
  });

  it('updates and persists global SaaS platform settings including Pix and announcement banner', () => {
    const saved = AppStore.updatePlatformSettings(
      {
        platform_name: 'Agil OS Enterprise',
        pix_key: 'pix@agilos.com.br',
        pix_beneficiary: 'AGIL OS TECNOLOGIA',
        pix_city: 'SAO PAULO',
        support_whatsapp: '5511988887777',
        support_email: 'suporte@agilos.com.br',
        default_trial_days: 21,
        annual_discount_percent: 25,
        global_announcement: 'Atualização programada para domingo às 23h.',
        global_announcement_type: 'warning'
      },
      'Super Admin'
    );

    expect(saved.platform_name).toBe('Agil OS Enterprise');
    expect(saved.pix_key).toBe('pix@agilos.com.br');
    expect(saved.default_trial_days).toBe(21);
    expect(saved.annual_discount_percent).toBe(25);
    expect(saved.global_announcement_type).toBe('warning');

    const loaded = AppStore.getPlatformSettings();
    expect(loaded.pix_key).toBe('pix@agilos.com.br');
    expect(loaded.global_announcement).toBe('Atualização programada para domingo às 23h.');

    // Bounds enforcement check
    const clamped = AppStore.updatePlatformSettings({ default_trial_days: 0, annual_discount_percent: 120 }, 'Super Admin');
    expect(clamped.default_trial_days).toBe(1);
    expect(clamped.annual_discount_percent).toBe(90);
  });

  it('handles null custom_max_users and custom_price from DB subscriptions on Plano Profissional without limiting to 1 user', () => {
    const email = `workprint.${Date.now()}@impressora.com.br`;
    const profPlanId = 'a1000000-0000-0000-0000-000000000003';
    const company = AppStore.addCompany(
      {
        trade_name: 'WorkPrint Impressoras',
        corporate_name: 'WorkPrint LTDA',
        cnpj: '44.555.666/0001-77',
        phone: '(11) 95555-4444',
        email
      },
      {
        fullName: 'Fábio de Souza',
        email,
        password: 'SenhaForte@2026',
        phone: '(11) 95555-4444'
      },
      profPlanId,
      'Super Admin',
      'ASSISTENCIA_INFORMATICA'
    );

    AppStore.assignPlanToCompany(
      company.id,
      profPlanId,
      {
        custom_max_users: null as unknown as number,
        custom_price: null as unknown as number
      },
      'Super Admin'
    );

    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const raw = localStorage.getItem(key);
        if (raw && raw.includes(company.id) && raw.includes('subscriptions')) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.subscriptions)) {
            parsed.subscriptions = parsed.subscriptions.map((sub: Record<string, unknown>) =>
              sub.tenant_id === company.id
                ? { ...sub, custom_max_users: null, custom_price: null }
                : sub
            );
            localStorage.setItem(key, JSON.stringify(parsed));
          }
        }
      }
    }

    const limits = AppStore.getEffectiveLimits(company.id);
    expect(limits.plan.id).toBe(profPlanId);
    expect(limits.maxUsers).toBe(10);
    expect(limits.usedUsers).toBe(1);
    expect(limits.availableUsers).toBe(9);
    expect(limits.canAddUser).toBe(true);
    expect(limits.finalMonthlyPrice).toBe(59.9);

    for (let u = 2; u <= 10; u++) {
      AppStore.addUser(
        {
          tenant_id: company.id,
          full_name: `Técnico ${u}`,
          email: `tec${u}.${Date.now()}@impressora.com.br`,
          role: 'TECNICO',
          is_active: true
        },
        'Fábio de Souza'
      );
    }

    const fullLimits = AppStore.getEffectiveLimits(company.id);
    expect(fullLimits.usedUsers).toBe(10);
    expect(fullLimits.availableUsers).toBe(0);
    expect(fullLimits.canAddUser).toBe(false);

    expect(() =>
      AppStore.addUser(
        {
          tenant_id: company.id,
          full_name: 'Técnico Excedente',
          email: `tec11.${Date.now()}@impressora.com.br`,
          role: 'TECNICO',
          is_active: true
        },
        'Fábio de Souza'
      )
    ).toThrow(/Limite máximo de usuários atingido/);
  });

  it('reflects plan modules dynamically across Inicial, Básico and Profissional tiers', () => {
    const email = `modulos.${Date.now()}@assistencia.com.br`;
    const inicialId = 'a1000000-0000-0000-0000-000000000001';
    const basicoId = 'a1000000-0000-0000-0000-000000000002';
    const profId = 'a1000000-0000-0000-0000-000000000003';

    const company = AppStore.addCompany(
      {
        trade_name: 'Loja Modulos Teste',
        corporate_name: 'Loja Modulos Teste LTDA',
        cnpj: '55.666.777/0001-88',
        phone: '(11) 94444-3333',
        email
      },
      {
        fullName: 'Ana Admin',
        email,
        password: 'SenhaForte@2026',
        phone: '(11) 94444-3333'
      },
      inicialId,
      'Super Admin',
      'ASSISTENCIA_INFORMATICA'
    );

    expect(AppStore.getEffectiveLimits(company.id).maxUsers).toBe(3);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'balcao_os')).toBe(true);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'frente_caixa')).toBe(false);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'relatorios_financeiros')).toBe(false);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'permissoes_rbac')).toBe(false);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'auditoria_lgpd')).toBe(false);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'multi_segmento')).toBe(false);

    AppStore.assignPlanToCompany(company.id, basicoId, {}, 'Super Admin');
    expect(AppStore.getEffectiveLimits(company.id).maxUsers).toBe(5);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'frente_caixa')).toBe(true);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'permissoes_rbac')).toBe(false);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'auditoria_lgpd')).toBe(false);
    expect(AppStore.isModuleEnabledForTenant(company.id, 'multi_segmento')).toBe(false);

    AppStore.assignPlanToCompany(company.id, profId, {}, 'Super Admin');
    expect(AppStore.getEffectiveLimits(company.id).maxUsers).toBe(10);
    for (const mod of SYSTEM_MODULES) {
      expect(AppStore.isModuleEnabledForTenant(company.id, mod.key)).toBe(true);
    }
  });
});

