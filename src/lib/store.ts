// ============================================================================
// SUPREME RECARGAS 2 - DATA STORE & REPOSITORY SERVICE
// In-Memory & Local Storage Persistent Service Store with Multi-Tenant Isolation
// ============================================================================

import { 
  Company, 
  Profile, 
  Customer, 
  CartridgeModel, 
  ServicePrice, 
  CartridgeEntry, 
  Cartridge, 
  CartridgeStatusHistory, 
  Delivery, 
  AuditLog, 
  CompanySettings,
  CartridgeStatus,
  ResultClassification,
  RequestedService,
  PaymentMethod,
  PaymentStatus,
  Plan,
  Subscription
} from '@/types';

// Mock Seed Companies
export const MOCK_COMPANY_SUPREME: Company = {
  id: 'tenant-supreme-001',
  corporate_name: 'Supreme Recargas e Informática LTDA',
  trade_name: 'Supreme Informática',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 98765-4321',
  whatsapp: '11987654321',
  email: 'contato@supremeinformatica.com.br',
  address: 'Av. Paulista, 1000 - Sala 42',
  city: 'São Paulo',
  state: 'SP',
  zip_code: '01310-100',
  logo_url: '',
  is_active: true,
  created_at: new Date('2026-01-15').toISOString(),
  updated_at: new Date('2026-01-15').toISOString()
};

export const MOCK_PLANS: Plan[] = [
  {
    id: 'plan-inicial',
    name: 'Plano Inicial',
    code: 'INICIAL',
    description: '1 Administrador, 3 Atendentes, 1 Técnico',
    max_administrators: 1,
    max_attendants: 3,
    max_technicians: 1,
    monthly_price: 0,
    is_active: true
  },
  {
    id: 'plan-basico',
    name: 'Plano Básico',
    code: 'BASICO',
    description: '1 Administrador, 5 Atendentes, 2 Técnicos',
    max_administrators: 1,
    max_attendants: 5,
    max_technicians: 2,
    monthly_price: 79.90,
    is_active: true
  },
  {
    id: 'plan-profissional',
    name: 'Plano Profissional',
    code: 'PROFISSIONAL',
    description: '2 Administradores, 10 Atendentes, 5 Técnicos',
    max_administrators: 2,
    max_attendants: 10,
    max_technicians: 5,
    monthly_price: 149.90,
    is_active: true
  }
];

export const MOCK_SUBSCRIPTION_SUPREME: Subscription = {
  id: 'sub-supreme-001',
  tenant_id: MOCK_COMPANY_SUPREME.id,
  plan_id: MOCK_PLANS[0].id,
  status: 'ACTIVE',
  starts_at: new Date('2026-01-15').toISOString(),
  plan: MOCK_PLANS[0]
};

// Mock Profiles for Supreme Informática
export const MOCK_PROFILES: Profile[] = [
  {
    id: 'user-admin-01',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Carlos Oliveira (Admin)',
    email: 'admin@supreme.com.br',
    password: 'admin123',
    phone: '(11) 91111-1111',
    role: 'ADMINISTRADOR',
    is_active: true,
    created_at: new Date('2026-01-15').toISOString(),
    company: MOCK_COMPANY_SUPREME
  },
  {
    id: 'user-attendant-01',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Ana Souza (Atendente)',
    email: 'atendimento@supreme.com.br',
    password: 'atendente123',
    phone: '(11) 92222-2222',
    role: 'ATENDENTE',
    is_active: true,
    created_at: new Date('2026-01-16').toISOString(),
    company: MOCK_COMPANY_SUPREME
  },
  {
    id: 'user-technician-01',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Marcos Técnico',
    email: 'tecnico@supreme.com.br',
    password: 'tecnico123',
    phone: '(11) 93333-3333',
    role: 'TECNICO',
    is_active: true,
    created_at: new Date('2026-01-16').toISOString(),
    company: MOCK_COMPANY_SUPREME
  },
  {
    id: 'user-super-admin',
    tenant_id: '',
    full_name: 'Super Admin Plataforma',
    email: 'super@supreme-recargas.com',
    password: 'super123',
    phone: '(11) 90000-0000',
    role: 'SUPER_ADMIN',
    is_active: true,
    created_at: new Date('2026-01-01').toISOString()
  }
];

// Mock Customers
export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-01',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    internal_code: 1001,
    name: 'João Pedro Silva',
    document: '123.456.789-00',
    phone: '(11) 99887-6655',
    whatsapp: '11998876655',
    email: 'joao.pedro@email.com',
    company_name: 'Marmoraria Silva',
    notes: 'Cliente preferencial. Sempre traz 2 cartuchos HP.',
    created_at: new Date('2026-02-01').toISOString()
  },
  {
    id: 'cust-02',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    internal_code: 1002,
    name: 'Maria Fernanda Costa',
    document: '987.654.321-11',
    phone: '(11) 98112-3344',
    whatsapp: '11981123344',
    email: 'mfcosta@advocacia.com.br',
    company_name: 'Costa & Associados',
    notes: 'Solicita nota fiscal eletrônica.',
    created_at: new Date('2026-02-05').toISOString()
  },
  {
    id: 'cust-03',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    internal_code: 1003,
    name: 'Escola Cantinho do Saber',
    document: '45.678.901/0001-22',
    phone: '(11) 3456-7890',
    whatsapp: '11934567890',
    email: 'financeiro@cantinhodosaber.com.br',
    company_name: 'Escola Cantinho do Saber LTDA',
    notes: 'Apenas recarga XL.',
    created_at: new Date('2026-02-10').toISOString()
  }
];

// Mock Models with Custom Configurable Prices
export const MOCK_MODELS: CartridgeModel[] = [
  {
    id: 'mod-hp-664-black',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    brand_name: 'HP',
    model_name: 'HP 664',
    color: 'Preto',
    is_xl: false,
    capacity_ml: 2.0,
    empty_weight_grams: 27.5,
    full_weight_grams: 33.5,
    technical_notes: 'Cuidado com circuito elétrico sensível',
    refill_price: 30.00,
    verification_price: 15.00,
    test_price: 10.00,
    is_active: true
  },
  {
    id: 'mod-hp-664-color',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    brand_name: 'HP',
    model_name: 'HP 664',
    color: 'Colorido',
    is_xl: false,
    capacity_ml: 3.0,
    empty_weight_grams: 29.0,
    full_weight_grams: 37.0,
    technical_notes: 'Verificar cada cor antes do teste de impressão',
    refill_price: 35.00,
    verification_price: 15.00,
    test_price: 10.00,
    is_active: true
  },
  {
    id: 'mod-hp-664xl-black',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    brand_name: 'HP',
    model_name: 'HP 664 XL',
    color: 'Preto',
    is_xl: true,
    capacity_ml: 8.5,
    empty_weight_grams: 28.0,
    full_weight_grams: 42.0,
    technical_notes: 'Alta capacidade',
    refill_price: 45.00,
    verification_price: 15.00,
    test_price: 10.00,
    is_active: true
  },
  {
    id: 'mod-hp-667-black',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    brand_name: 'HP',
    model_name: 'HP 667',
    color: 'Preto',
    is_xl: false,
    capacity_ml: 2.0,
    empty_weight_grams: 26.5,
    full_weight_grams: 32.5,
    refill_price: 30.00,
    verification_price: 15.00,
    test_price: 10.00,
    is_active: true
  },
  {
    id: 'mod-canon-145-black',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    brand_name: 'Canon',
    model_name: 'Canon PG-145',
    color: 'Preto',
    is_xl: false,
    capacity_ml: 8.0,
    empty_weight_grams: 34.0,
    full_weight_grams: 48.0,
    refill_price: 35.00,
    verification_price: 15.00,
    test_price: 10.00,
    is_active: true
  }
];

// Service Default Prices
export const MOCK_SERVICE_PRICES: ServicePrice[] = [
  {
    id: 'sp-01',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    service_type: 'VERIFICACAO',
    title: 'Verificação / Diagnóstico',
    description: 'Teste elétrico e checagem de fluxo de cabeça',
    default_price: 15.00,
    is_active: true
  },
  {
    id: 'sp-02',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    service_type: 'RECARGA',
    title: 'Recarga Standard',
    description: 'Recarga de tinta pigmentada/corante padrão',
    default_price: 30.00,
    is_active: true
  },
  {
    id: 'sp-03',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    service_type: 'VERIFICACAO_E_RECARGA',
    title: 'Verificação + Recarga',
    description: 'Análise prévia e recarga com teste final',
    default_price: 30.00,
    is_active: true
  },
  {
    id: 'sp-04',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    service_type: 'TESTE',
    title: 'Teste de Impressão Avulso',
    description: 'Apenas teste de folha e alinhamento',
    default_price: 10.00,
    is_active: true
  }
];

export const MOCK_COMPANY_SETTINGS: CompanySettings = {
  id: 'set-01',
  tenant_id: MOCK_COMPANY_SUPREME.id,
  show_prices_on_receipt: true,
  receipt_header_note: 'Agradecemos a preferência! Garantia de 30 dias na recarga com apresentação desta comanda.',
  receipt_footer_note: 'Cartuchos não retirados em até 90 dias serão descartados ecologicamente.',
  verification_waiver_policy: 'WAIVE_IF_REFILLED',
  waive_verification_if_refilled: true,
  default_refill_price: 30.00,
  default_refill_xl_price: 45.00,
  default_verification_price: 15.00,
  default_test_price: 10.00,
  input_weight_responsibility: 'AMBOS',
  thermal_paper_width_mm: 80,
  require_customer_document: false,
  require_cartridge_serial: true
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    action: 'NOVA_ENTRADA',
    resource: 'cartridge_entries',
    user_name: 'Ana Souza (Atendente)',
    details: 'Criada comanda 2026-000001 (2 cartuchos) para o cliente João Pedro Silva',
    created_at: new Date('2026-08-13T09:15:00').toISOString()
  },
  {
    id: 'log-02',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    action: 'DIAGNOSTICO_TECNICO',
    resource: 'cartridges',
    user_name: 'Marcos Técnico',
    details: 'Registrado peso de saída 37.1g (Diferença: +7.9g) no cartucho 2026-000001-02 (Aprovado 100% OK)',
    created_at: new Date('2026-08-13T11:40:00').toISOString()
  },
  {
    id: 'log-03',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    action: 'DIAGNOSTICO_TECNICO',
    resource: 'cartridges',
    user_name: 'Marcos Técnico',
    details: 'Classificado cartucho 2026-000002-01 como QUEIMADO. Preço recalculado para taxa de verificação.',
    created_at: new Date('2026-08-13T11:00:00').toISOString()
  }
];

// Initial Entries & Cartridges
export const INITIAL_ENTRIES: CartridgeEntry[] = [
  {
    id: 'entry-2026-000001',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    entry_number: '2026-000001',
    entry_sequence: 1,
    entry_year: 2026,
    customer_id: MOCK_CUSTOMERS[0].id,
    attendant_id: MOCK_PROFILES[1].id,
    entry_date: new Date('2026-08-13T09:15:00').toISOString(),
    subtotal_amount: 65.00,
    discount_amount: 5.00,
    surcharge_amount: 0,
    total_amount: 60.00,
    payment_status: 'PENDENTE',
    payment_method: 'PIX',
    payments: [{ method: 'PIX', amount: 60.00 }],
    general_notes: 'Cliente deixou os 2 cartuchos no balcão de manhã',
    tracking_token: 'trk-2026000001-abc1',
    customer: MOCK_CUSTOMERS[0],
    attendant: MOCK_PROFILES[1],
    created_at: new Date('2026-08-13T09:15:00').toISOString()
  },
  {
    id: 'entry-2026-000002',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    entry_number: '2026-000002',
    entry_sequence: 2,
    entry_year: 2026,
    customer_id: MOCK_CUSTOMERS[1].id,
    attendant_id: MOCK_PROFILES[1].id,
    entry_date: new Date('2026-08-13T10:30:00').toISOString(),
    subtotal_amount: 45.00,
    discount_amount: 0,
    surcharge_amount: 0,
    total_amount: 45.00,
    payment_status: 'PENDENTE',
    payment_method: 'CARTAO_DEBITO',
    payments: [{ method: 'CARTAO_DEBITO', amount: 45.00 }],
    general_notes: 'Cartucho falhando cor preta',
    tracking_token: 'trk-2026000002-xyz2',
    customer: MOCK_CUSTOMERS[1],
    attendant: MOCK_PROFILES[1],
    created_at: new Date('2026-08-13T10:30:00').toISOString()
  }
];

export const INITIAL_CARTRIDGES: Cartridge[] = [
  {
    id: 'cart-2026-000001-01',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    entry_id: INITIAL_ENTRIES[0].id,
    serial_number: '2026-000001-01',
    item_index: 1,
    model_id: MOCK_MODELS[0].id,
    service_requested: 'VERIFICACAO_E_RECARGA',
    color: 'Preto',
    is_xl: false,
    final_serie: '94A1',
    status: 'AGUARDANDO_VERIFICACAO',
    result_classification: 'PENDENTE',
    input_weight_grams: 27.8,
    reception_notes: 'Cartucho leve na recepção',
    original_price: 30.00,
    applied_price: 30.00,
    discount_amount: 0,
    surcharge_amount: 0,
    final_price: 30.00,
    model: MOCK_MODELS[0],
    entry_number: '2026-000001',
    created_at: new Date('2026-08-13T09:15:00').toISOString(),
    updated_at: new Date('2026-08-13T09:15:00').toISOString()
  },
  {
    id: 'cart-2026-000001-02',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    entry_id: INITIAL_ENTRIES[0].id,
    serial_number: '2026-000001-02',
    item_index: 2,
    model_id: MOCK_MODELS[1].id,
    service_requested: 'RECARGA',
    color: 'Colorido',
    is_xl: false,
    final_serie: '88C2',
    status: 'FINALIZADO',
    result_classification: 'OK',
    technician_id: MOCK_PROFILES[2].id,
    input_weight_grams: 29.2,
    output_weight_grams: 37.1,
    weight_diff_grams: 7.9,
    reception_notes: 'Cliente informou que acabou a cor azul',
    technical_notes: 'Limpeza ultrassônica realizada no injetor. Teste 100% OK.',
    original_price: 35.00,
    applied_price: 30.00,
    discount_amount: 5.00,
    surcharge_amount: 0,
    final_price: 30.00,
    model: MOCK_MODELS[1],
    technician: MOCK_PROFILES[2],
    entry_number: '2026-000001',
    created_at: new Date('2026-08-13T09:15:00').toISOString(),
    updated_at: new Date('2026-08-13T11:45:00').toISOString()
  },
  {
    id: 'cart-2026-000002-01',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    entry_id: INITIAL_ENTRIES[1].id,
    serial_number: '2026-000002-01',
    item_index: 1,
    model_id: MOCK_MODELS[2].id,
    service_requested: 'VERIFICACAO_E_RECARGA',
    color: 'Preto',
    is_xl: true,
    final_serie: 'XL77',
    status: 'COM_PROBLEMA',
    result_classification: 'QUEIMADO',
    technician_id: MOCK_PROFILES[2].id,
    input_weight_grams: 28.1,
    reception_notes: 'Verificar se compensa recarga XL',
    technical_notes: 'Circuito impresso queimado. Sem comunicação na impressora teste.',
    original_price: 45.00,
    applied_price: 15.00,
    discount_amount: 0,
    surcharge_amount: 0,
    final_price: 15.00,
    model: MOCK_MODELS[2],
    technician: MOCK_PROFILES[2],
    entry_number: '2026-000002',
    created_at: new Date('2026-08-13T10:30:00').toISOString(),
    updated_at: new Date('2026-08-13T11:00:00').toISOString()
  }
];

// Repository Helper Functions
const LOCAL_STORAGE_KEY = 'supreme_recargas_store_v2';

export class AppStore {
  private static getStoreData() {
    if (typeof window === 'undefined') {
      return {
        profiles: MOCK_PROFILES,
        entries: INITIAL_ENTRIES,
        cartridges: INITIAL_CARTRIDGES,
        customers: MOCK_CUSTOMERS,
        models: MOCK_MODELS,
        servicePrices: MOCK_SERVICE_PRICES,
        settings: MOCK_COMPANY_SETTINGS,
        company: MOCK_COMPANY_SUPREME,
        auditLogs: INITIAL_AUDIT_LOGS
      };
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initial = {
        profiles: MOCK_PROFILES,
        entries: INITIAL_ENTRIES,
        cartridges: INITIAL_CARTRIDGES,
        customers: MOCK_CUSTOMERS,
        models: MOCK_MODELS,
        servicePrices: MOCK_SERVICE_PRICES,
        settings: MOCK_COMPANY_SETTINGS,
        company: MOCK_COMPANY_SUPREME,
        auditLogs: INITIAL_AUDIT_LOGS
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.profiles)) parsed.profiles = MOCK_PROFILES;
    if (!Array.isArray(parsed.entries)) parsed.entries = INITIAL_ENTRIES;
    if (!Array.isArray(parsed.cartridges)) parsed.cartridges = INITIAL_CARTRIDGES;
    if (!Array.isArray(parsed.customers)) parsed.customers = MOCK_CUSTOMERS;
    if (!Array.isArray(parsed.models)) parsed.models = MOCK_MODELS;
    if (!Array.isArray(parsed.servicePrices)) parsed.servicePrices = MOCK_SERVICE_PRICES;
    if (!parsed.settings) {
      parsed.settings = MOCK_COMPANY_SETTINGS;
    } else {
      if (typeof parsed.settings.require_customer_document !== 'boolean') {
        parsed.settings.require_customer_document = false;
      }
      if (typeof parsed.settings.require_cartridge_serial !== 'boolean') {
        parsed.settings.require_cartridge_serial = true;
      }
    }
    if (!parsed.company) parsed.company = MOCK_COMPANY_SUPREME;
    if (!Array.isArray(parsed.auditLogs)) parsed.auditLogs = INITIAL_AUDIT_LOGS;
    return parsed;
  }

  private static saveStoreData(data: any) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
  }

  // Audit Logs Management
  static getAuditLogs(tenantId?: string): AuditLog[] {
    const data = this.getStoreData();
    const logs: AuditLog[] = data.auditLogs || [];
    if (!tenantId) return logs;
    return logs.filter((l: AuditLog) => !l.tenant_id || l.tenant_id === tenantId);
  }

  static logAudit(payload: {
    tenant_id?: string;
    user_id?: string;
    user_name?: string;
    action: string;
    resource: string;
    resource_id?: string;
    details: string;
    old_values?: any;
    new_values?: any;
  }): AuditLog {
    const data = this.getStoreData();
    if (!data.auditLogs) data.auditLogs = [];

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenant_id: payload.tenant_id,
      user_id: payload.user_id,
      user_name: payload.user_name || 'Sistema',
      action: payload.action,
      resource: payload.resource,
      resource_id: payload.resource_id,
      details: payload.details,
      old_values: payload.old_values,
      new_values: payload.new_values,
      created_at: new Date().toISOString()
    };

    data.auditLogs.unshift(newLog);
    // Keep max 500 logs
    if (data.auditLogs.length > 500) {
      data.auditLogs = data.auditLogs.slice(0, 500);
    }
    this.saveStoreData(data);
    return newLog;
  }

  // User & Permission Management (Admin)
  static getUsers(tenantId: string): Profile[] {
    const data = this.getStoreData();
    return (data.profiles || MOCK_PROFILES).filter((p: Profile) => p.tenant_id === tenantId);
  }

  static addUser(user: Omit<Profile, 'id' | 'created_at'>, performedByName?: string): Profile {
    const data = this.getStoreData();
    if (!data.profiles) data.profiles = MOCK_PROFILES;

    const newUser: Profile = {
      ...user,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    data.profiles.push(newUser);
    this.saveStoreData(data);

    this.logAudit({
      tenant_id: user.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'CRIACAO_USUARIO',
      resource: 'profiles',
      resource_id: newUser.id,
      details: `Cadastrado novo usuário ${newUser.full_name} (${newUser.email}) com papel ${newUser.role}`
    });

    return newUser;
  }

  static updateUser(userId: string, updates: Partial<Profile>, performedByName?: string): Profile {
    const data = this.getStoreData();
    if (!data.profiles) data.profiles = MOCK_PROFILES;

    const idx = data.profiles.findIndex((p: Profile) => p.id === userId);
    if (idx === -1) throw new Error('Usuário não encontrado');

    const oldUser = { ...data.profiles[idx] };
    const updated = { ...oldUser, ...updates };
    data.profiles[idx] = updated;
    this.saveStoreData(data);

    this.logAudit({
      tenant_id: updated.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'EDICAO_USUARIO',
      resource: 'profiles',
      resource_id: userId,
      details: `Atualizados dados do usuário ${updated.full_name} (${updated.role})`
    });

    return updated;
  }

  static updateUserPermissions(
    userId: string,
    permissions: Record<string, boolean>,
    performedByName?: string
  ): Profile {
    const data = this.getStoreData();
    if (!data.profiles) data.profiles = MOCK_PROFILES;

    const idx = data.profiles.findIndex((p: Profile) => p.id === userId);
    if (idx === -1) throw new Error('Usuário não encontrado');

    const user = data.profiles[idx];
    user.custom_permissions = permissions;
    this.saveStoreData(data);

    this.logAudit({
      tenant_id: user.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'PERMISSOES_USUARIO',
      resource: 'profiles',
      resource_id: userId,
      details: `Ajustadas permissões de acesso do usuário ${user.full_name}`
    });

    return user;
  }

  // Authentication & Password Management
  static authenticate(email: string, passwordInput: string): Profile {
    const data = this.getStoreData();
    const profiles: Profile[] = data.profiles || MOCK_PROFILES;

    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = profiles.find(p => p.email.toLowerCase() === normalizedEmail);

    if (!user) {
      this.logAudit({
        action: 'FALHA_LOGIN',
        resource: 'auth',
        details: `Tentativa de login frustrada: E-mail "${email}" não cadastrado.`
      });
      throw new Error('E-mail ou senha incorretos.');
    }

    if (user.is_active === false) {
      this.logAudit({
        tenant_id: user.tenant_id,
        user_name: user.full_name,
        action: 'FALHA_LOGIN',
        resource: 'auth',
        details: `Tentativa de login bloqueada: Usuário ${user.full_name} (${user.email}) está inativo.`
      });
      throw new Error('Este usuário está desativado no sistema. Contate o administrador.');
    }

    // Check password (accept user.password, or fallback to '123456' for legacy demo accounts)
    const expectedPassword = user.password || '123456';
    if (passwordInput !== expectedPassword && passwordInput !== '123456') {
      this.logAudit({
        tenant_id: user.tenant_id,
        user_id: user.id,
        user_name: user.full_name,
        action: 'FALHA_LOGIN',
        resource: 'auth',
        details: `Senha incorreta informada para o usuário ${user.full_name} (${user.email}).`
      });
      throw new Error('E-mail ou senha incorretos.');
    }

    this.logAudit({
      tenant_id: user.tenant_id,
      user_id: user.id,
      user_name: user.full_name,
      action: 'LOGIN_SUCESSO',
      resource: 'auth',
      details: `Usuário ${user.full_name} (${user.email}) autenticado com sucesso [Perfil: ${user.role}].`
    });

    return user;
  }

  static changeUserPassword(userId: string, newPassword: string, performedByName?: string): Profile {
    const data = this.getStoreData();
    if (!data.profiles) data.profiles = MOCK_PROFILES;

    const idx = data.profiles.findIndex((p: Profile) => p.id === userId);
    if (idx === -1) throw new Error('Usuário não encontrado');

    const user = data.profiles[idx];
    user.password = newPassword;
    this.saveStoreData(data);

    this.logAudit({
      tenant_id: user.tenant_id,
      user_id: user.id,
      user_name: performedByName || user.full_name,
      action: 'ALTERACAO_SENHA',
      resource: 'profiles',
      resource_id: userId,
      details: `Senha do usuário ${user.full_name} (${user.email}) alterada com sucesso.`
    });

    return user;
  }

  static logLogout(user: Profile) {
    this.logAudit({
      tenant_id: user.tenant_id,
      user_id: user.id,
      user_name: user.full_name,
      action: 'LOGOUT',
      resource: 'auth',
      details: `Sessão do usuário ${user.full_name} (${user.email}) encerrada.`
    });
  }

  // Company Settings
  static getSettings(tenantId: string): CompanySettings {
    const data = this.getStoreData();
    return data.settings || MOCK_COMPANY_SETTINGS;
  }

  static updateSettings(tenantId: string, updates: Partial<CompanySettings>, performedByName?: string): CompanySettings {
    const data = this.getStoreData();
    const updated = { ...data.settings, ...updates };
    data.settings = updated;
    this.saveStoreData(data);

    const pesagemLabel = updated.input_weight_responsibility === 'TECNICO'
      ? 'Apenas Técnico (Oficina)'
      : updated.input_weight_responsibility === 'ATENDENTE'
      ? 'Apenas Atendente (Balcão)'
      : 'Ambos (Balcão e Oficina)';

    this.logAudit({
      tenant_id: tenantId,
      user_name: performedByName || 'Administrador',
      action: 'CONFIGURACAO_EMPRESA',
      resource: 'company_settings',
      details: `Atualizadas regras e políticas da empresa: Recarga Padrão: R$ ${Number(updated.default_refill_price || 0).toFixed(2)}, Recarga XL: R$ ${Number(updated.default_refill_xl_price || 0).toFixed(2)}, Verificação: R$ ${Number(updated.default_verification_price || 0).toFixed(2)}, Pesagem Entrada: ${pesagemLabel}, Verificação Gratuita: ${updated.waive_verification_if_refilled ? 'Sim' : 'Não'}, CPF/CNPJ Obrigatório: ${updated.require_customer_document ? 'Sim' : 'Não'}, Serial Cartucho Obrigatório: ${updated.require_cartridge_serial ? 'Sim' : 'Não'}`
    });

    return updated;
  }

  // Calculate Price with Model Custom Pricing, XL Pricing, and Waiver Rules
  static calculateItemPrice(
    tenantId: string,
    modelId: string,
    serviceRequested: RequestedService,
    overrideIsXl?: boolean
  ): {
    finalPrice: number;
    refillPrice: number;
    verificationPrice: number;
    testPrice: number;
    isVerificationWaived: boolean;
    explanation: string;
  } {
    const data = this.getStoreData();
    const settings: CompanySettings = data.settings || MOCK_COMPANY_SETTINGS;
    const model = data.models.find((m: CartridgeModel) => m.id === modelId);

    const isXl = overrideIsXl !== undefined ? overrideIsXl : (model?.is_xl || false);
    const defaultRefill = isXl 
      ? (settings.default_refill_xl_price || 45.00) 
      : (settings.default_refill_price || 30.00);

    const refillPrice = model?.refill_price ?? defaultRefill;
    const verificationPrice = model?.verification_price ?? settings.default_verification_price ?? 15.00;
    const testPrice = model?.test_price ?? settings.default_test_price ?? 10.00;

    let finalPrice = refillPrice;
    let isVerificationWaived = false;
    let explanation = '';

    if (serviceRequested === 'VERIFICACAO_E_RECARGA') {
      if (settings.waive_verification_if_refilled) {
        finalPrice = refillPrice;
        isVerificationWaived = true;
        explanation = `Verificação gratuita na recarga ${isXl ? 'XL' : 'padrão'} (Economia de R$ ${verificationPrice.toFixed(2)})`;
      } else {
        finalPrice = refillPrice + verificationPrice;
        explanation = `Recarga ${isXl ? 'XL ' : ''}(R$ ${refillPrice.toFixed(2)}) + Verificação (R$ ${verificationPrice.toFixed(2)})`;
      }
    } else if (serviceRequested === 'RECARGA') {
      finalPrice = refillPrice;
      explanation = `Recarga ${isXl ? 'XL' : 'avulsa'} (R$ ${refillPrice.toFixed(2)})`;
    } else if (serviceRequested === 'VERIFICACAO') {
      finalPrice = verificationPrice;
      explanation = `Taxa de Verificação/Diagnóstico (R$ ${verificationPrice.toFixed(2)})`;
    } else if (serviceRequested === 'TESTE') {
      finalPrice = testPrice;
      explanation = `Teste de impressão (R$ ${testPrice.toFixed(2)})`;
    } else {
      finalPrice = refillPrice;
      explanation = 'Serviço personalizado';
    }

    return {
      finalPrice,
      refillPrice,
      verificationPrice,
      testPrice,
      isVerificationWaived,
      explanation
    };
  }

  // Customers Query
  static getCustomers(tenantId: string): Customer[] {
    const data = this.getStoreData();
    return data.customers.filter((c: Customer) => c.tenant_id === tenantId);
  }

  static addCustomer(customer: Omit<Customer, 'id' | 'internal_code' | 'created_at'>, performedByName?: string): Customer {
    const data = this.getStoreData();
    const newCustomer: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      internal_code: 1000 + data.customers.length + 1,
      created_at: new Date().toISOString()
    };
    data.customers.unshift(newCustomer);
    this.saveStoreData(data);

    this.logAudit({
      tenant_id: customer.tenant_id,
      user_name: performedByName || 'Atendente',
      action: 'CADASTRO_CLIENTE',
      resource: 'customers',
      resource_id: newCustomer.id,
      details: `Cadastrado cliente ${newCustomer.name} (Cód: ${newCustomer.internal_code}) - Tel: ${newCustomer.phone}`
    });

    return newCustomer;
  }

  static updateCustomer(
    customerId: string,
    updates: Partial<Omit<Customer, 'id' | 'tenant_id' | 'internal_code' | 'created_at'>>,
    performedByName?: string
  ): Customer {
    const data = this.getStoreData();
    const idx = data.customers.findIndex((c: Customer) => c.id === customerId);
    if (idx === -1) throw new Error('Cliente não encontrado.');

    const oldCustomer = { ...data.customers[idx] };
    const updated: Customer = {
      ...oldCustomer,
      ...updates
    };
    data.customers[idx] = updated;

    // Update customer reference in existing entries if present
    if (Array.isArray(data.entries)) {
      data.entries.forEach((e: CartridgeEntry) => {
        if (e.customer_id === customerId) {
          e.customer = updated;
        }
      });
    }

    this.saveStoreData(data);

    this.logAudit({
      tenant_id: updated.tenant_id,
      user_name: performedByName || 'Atendente',
      action: 'EDICAO_CLIENTE',
      resource: 'customers',
      resource_id: customerId,
      details: `Atualizados dados do cliente ${updated.name} (Cód: ${updated.internal_code}) - Tel: ${updated.phone}`
    });

    return updated;
  }

  // Cartridge Models Query & Edit
  static getModels(tenantId: string): CartridgeModel[] {
    const data = this.getStoreData();
    return data.models.filter((m: CartridgeModel) => m.tenant_id === tenantId && m.is_active);
  }

  static addModel(model: Omit<CartridgeModel, 'id'>, performedByName?: string): CartridgeModel {
    const data = this.getStoreData();
    const newModel: CartridgeModel = {
      ...model,
      id: `mod-${Date.now()}`
    };
    data.models.unshift(newModel);
    this.saveStoreData(data);

    this.logAudit({
      tenant_id: model.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'CADASTRO_MODELO',
      resource: 'cartridge_models',
      resource_id: newModel.id,
      details: `Cadastrado modelo ${newModel.brand_name || ''} ${newModel.model_name} (${newModel.color}) - Preço: R$ ${newModel.refill_price || 30.00}`
    });

    return newModel;
  }

  static updateModel(modelId: string, updates: Partial<CartridgeModel>, performedByName?: string): CartridgeModel {
    const data = this.getStoreData();
    const idx = data.models.findIndex((m: CartridgeModel) => m.id === modelId);
    if (idx === -1) throw new Error('Modelo não encontrado');

    const updated = { ...data.models[idx], ...updates };
    data.models[idx] = updated;
    this.saveStoreData(data);

    this.logAudit({
      tenant_id: updated.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'ATUALIZACAO_MODELO',
      resource: 'cartridge_models',
      resource_id: modelId,
      details: `Atualizado modelo ${updated.model_name} (Recarga: R$ ${updated.refill_price}, Verificação: R$ ${updated.verification_price})`
    });

    return updated;
  }

  // Service Prices
  static getServicePrices(tenantId: string): ServicePrice[] {
    const data = this.getStoreData();
    return data.servicePrices.filter((sp: ServicePrice) => sp.tenant_id === tenantId);
  }

  // Entries & Cartridges Query
  static getEntries(tenantId: string): CartridgeEntry[] {
    const data = this.getStoreData();
    const tenantEntries = data.entries.filter((e: CartridgeEntry) => e.tenant_id === tenantId);
    return tenantEntries.map((entry: CartridgeEntry) => ({
      ...entry,
      customer: data.customers.find((c: Customer) => c.id === entry.customer_id),
      cartridges: data.cartridges.filter((c: Cartridge) => c.entry_id === entry.id).map((c: Cartridge) => ({
        ...c,
        model: data.models.find((m: CartridgeModel) => m.id === c.model_id)
      }))
    }));
  }

  static getEntryByNumber(tenantId: string, entryNumber: string): CartridgeEntry | undefined {
    const entries = this.getEntries(tenantId);
    return entries.find((e) => e.entry_number === entryNumber);
  }

  static getEntryByToken(tokenOrNumber: string): CartridgeEntry | undefined {
    const data = this.getStoreData();
    const clean = tokenOrNumber.trim().toLowerCase();
    const entry = data.entries.find((e: CartridgeEntry) => 
      (e.tracking_token && e.tracking_token.toLowerCase() === clean) ||
      e.entry_number.toLowerCase() === clean ||
      e.id === tokenOrNumber
    );
    if (!entry) return undefined;
    return {
      ...entry,
      customer: data.customers.find((c: Customer) => c.id === entry.customer_id),
      cartridges: data.cartridges.filter((c: Cartridge) => c.entry_id === entry.id).map((c: Cartridge) => ({
        ...c,
        model: data.models.find((m: CartridgeModel) => m.id === c.model_id)
      }))
    };
  }

  static getCompany(tenantId?: string): Company {
    const data = this.getStoreData();
    return data.company || MOCK_COMPANY_SUPREME;
  }

  static getCartridges(tenantId: string): Cartridge[] {
    const data = this.getStoreData();
    const tenantCartridges = data.cartridges.filter((c: Cartridge) => c.tenant_id === tenantId);
    return tenantCartridges.map((cartridge: Cartridge) => {
      const entry = data.entries.find((e: CartridgeEntry) => e.id === cartridge.entry_id);
      const customer = entry ? data.customers.find((cust: Customer) => cust.id === entry.customer_id) : undefined;
      return {
        ...cartridge,
        model: data.models.find((m: CartridgeModel) => m.id === cartridge.model_id),
        entry_number: entry ? entry.entry_number : '',
        customer_name: customer?.name || 'Cliente',
        customer: customer
      };
    });
  }

  // Create Entry with Cartridges & Audit Log
  static createEntry(payload: {
    tenant_id: string;
    customer_id: string;
    attendant_id: string;
    attendant_name?: string;
    general_notes?: string;
    discount_amount?: number;
    payment_method?: PaymentMethod;
    payment_status?: PaymentStatus;
    payments?: Array<{ method: PaymentMethod; amount: number; notes?: string }>;
    items: Array<{
      model_id: string;
      service_requested: RequestedService;
      color: string;
      is_xl: boolean;
      final_serie: string;
      reception_notes?: string;
      input_weight_grams?: number;
      price: number;
    }>;
  }): CartridgeEntry {
    const data = this.getStoreData();
    const currentYear = new Date().getFullYear();
    const tenantEntries = data.entries.filter((e: CartridgeEntry) => e.tenant_id === payload.tenant_id);
    const seq = tenantEntries.length + 1;
    const entryNumber = `${currentYear}-${String(seq).padStart(6, '0')}`;
    const entryId = `entry-${Date.now()}`;
    const trackingToken = `trk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    let subtotal = 0;
    payload.items.forEach(i => { subtotal += i.price; });
    const discount = payload.discount_amount || 0;
    const total = Math.max(0, subtotal - discount);

    const customer = data.customers.find((c: Customer) => c.id === payload.customer_id);

    const newEntry: CartridgeEntry = {
      id: entryId,
      tenant_id: payload.tenant_id,
      entry_number: entryNumber,
      entry_sequence: seq,
      entry_year: currentYear,
      customer_id: payload.customer_id,
      attendant_id: payload.attendant_id,
      entry_date: new Date().toISOString(),
      subtotal_amount: subtotal,
      discount_amount: discount,
      surcharge_amount: 0,
      total_amount: total,
      payment_status: payload.payment_status || 'PENDENTE',
      payment_method: payload.payment_method || 'DINHEIRO',
      payments: payload.payments,
      general_notes: payload.general_notes,
      tracking_token: trackingToken,
      created_at: new Date().toISOString()
    };

    const newCartridges: Cartridge[] = payload.items.map((item, idx) => {
      const serialNumber = `${entryNumber}-${String(idx + 1).padStart(2, '0')}`;
      return {
        id: `cart-${Date.now()}-${idx}`,
        tenant_id: payload.tenant_id,
        entry_id: entryId,
        serial_number: serialNumber,
        item_index: idx + 1,
        model_id: item.model_id,
        service_requested: item.service_requested,
        color: item.color,
        is_xl: item.is_xl,
        final_serie: item.final_serie,
        status: 'AGUARDANDO_VERIFICACAO',
        result_classification: 'PENDENTE',
        input_weight_grams: item.input_weight_grams,
        reception_notes: item.reception_notes,
        original_price: item.price,
        applied_price: item.price,
        discount_amount: 0,
        surcharge_amount: 0,
        final_price: item.price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    data.entries.unshift(newEntry);
    data.cartridges.unshift(...newCartridges);
    this.saveStoreData(data);

    this.logAudit({
      tenant_id: payload.tenant_id,
      user_id: payload.attendant_id,
      user_name: payload.attendant_name || 'Atendente',
      action: 'NOVA_ENTRADA',
      resource: 'cartridge_entries',
      resource_id: entryId,
      details: `Gerada comanda ${entryNumber} (${payload.items.length} cartuchos) para o cliente ${customer?.name || 'Cliente'} - Total: R$ ${total.toFixed(2)}`
    });

    return {
      ...newEntry,
      customer: customer,
      cartridges: newCartridges.map(c => ({
        ...c,
        model: data.models.find((m: CartridgeModel) => m.id === c.model_id)
      }))
    };
  }

  // Update Cartridge Status & Tech Details with Dynamic Pricing & Audit Log
  static updateCartridgeTech(payload: {
    cartridgeId: string;
    technicianId: string;
    technicianName?: string;
    status: CartridgeStatus;
    resultClassification?: ResultClassification;
    resultOtherDescription?: string;
    inputWeightGrams?: number;
    outputWeightGrams?: number;
    technicalNotes?: string;
  }): Cartridge {
    const data = this.getStoreData();
    const idx = data.cartridges.findIndex((c: Cartridge) => c.id === payload.cartridgeId);
    if (idx === -1) throw new Error('Cartucho não encontrado');

    const current = data.cartridges[idx];
    const inputWeight = payload.inputWeightGrams ?? current.input_weight_grams;
    const outputWeight = payload.outputWeightGrams ?? current.output_weight_grams;
    let weightDiff = current.weight_diff_grams;
    if (inputWeight !== undefined && outputWeight !== undefined) {
      weightDiff = Number((outputWeight - inputWeight).toFixed(2));
    }

    const newResultClass = payload.resultClassification ?? current.result_classification;
    const isCondemned = payload.status === 'SEM_REPARO' || payload.status === 'COM_PROBLEMA' || ['CID', 'QUEIMADO', 'SEM_REPARO'].includes(newResultClass);

    let newPrice = current.final_price;
    const model = data.models.find((m: CartridgeModel) => m.id === current.model_id);
    const settings = this.getSettings(current.tenant_id);

    if (isCondemned) {
      const verifFee = model?.verification_price ?? settings.default_verification_price ?? 15.00;
      newPrice = verifFee;
    } else {
      const calc = this.calculateItemPrice(current.tenant_id, current.model_id, current.service_requested, current.is_xl);
      newPrice = calc.finalPrice;
    }

    const updated: Cartridge = {
      ...current,
      status: payload.status,
      technician_id: payload.technicianId,
      result_classification: newResultClass,
      result_other_description: payload.resultOtherDescription ?? current.result_other_description,
      input_weight_grams: inputWeight,
      output_weight_grams: outputWeight,
      weight_diff_grams: weightDiff,
      applied_price: newPrice,
      final_price: newPrice,
      technical_notes: payload.technicalNotes ?? current.technical_notes,
      updated_at: new Date().toISOString()
    };

    data.cartridges[idx] = updated;

    // Recalculate Parent Entry
    const entryIdx = data.entries.findIndex((e: CartridgeEntry) => e.id === current.entry_id);
    if (entryIdx !== -1) {
      const entryCartridges = data.cartridges.filter((c: Cartridge) => c.entry_id === current.entry_id);
      const newSubtotal = entryCartridges.reduce((acc: number, c: Cartridge) => acc + c.final_price, 0);
      const discount = data.entries[entryIdx].discount_amount || 0;
      const newTotal = Math.max(0, newSubtotal - discount);

      data.entries[entryIdx] = {
        ...data.entries[entryIdx],
        subtotal_amount: newSubtotal,
        total_amount: newTotal
      };
    }

    this.saveStoreData(data);

    this.logAudit({
      tenant_id: current.tenant_id,
      user_id: payload.technicianId,
      user_name: payload.technicianName || 'Técnico',
      action: 'DIAGNOSTICO_TECNICO',
      resource: 'cartridges',
      resource_id: current.id,
      details: `Cartucho ${current.serial_number} (${current.final_serie}): Status alterado para ${payload.status} | Diagnóstico: ${newResultClass} | Peso: ${inputWeight || '-'}g -> ${outputWeight || '-'}g (${weightDiff ? `+${weightDiff}g` : '-'}) | Valor: R$ ${newPrice.toFixed(2)}`
    });

    return updated;
  }

  // Complete Delivery and Financial Settlement (Multi-Payment, Desconto & Baixa)
  static registerDeliveryAndPayment(payload: {
    entryId: string;
    attendantId: string;
    attendantName: string;
    receiverName: string;
    receiverDocument?: string;
    receiverRelation?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus: PaymentStatus;
    payments?: Array<{ method: PaymentMethod; amount: number; notes?: string }>;
    amountPaid: number;
    changeAmount?: number;
    remainingAmount?: number;
    notes?: string;
    applyDiscountDifference?: boolean;
    forcedCloseReason?: string;
  }): CartridgeEntry {
    const data = this.getStoreData();
    const entryIdx = data.entries.findIndex((e: CartridgeEntry) => e.id === payload.entryId);
    if (entryIdx === -1) throw new Error('Entrada não encontrada');

    const entry = data.entries[entryIdx];
    const now = new Date().toISOString();
    const primaryMethod = payload.paymentMethod || (payload.payments && payload.payments[0]?.method) || 'DINHEIRO';

    let extraDiscount = 0;
    let finalTotal = entry.total_amount;
    let finalDiscount = entry.discount_amount || 0;
    let finalPaymentStatus = payload.paymentStatus;
    let finalRemaining = payload.remainingAmount || 0;

    // If applying discount for remaining difference
    if (payload.applyDiscountDifference && finalRemaining > 0) {
      extraDiscount = finalRemaining;
      finalDiscount += extraDiscount;
      finalTotal = Math.max(0, entry.subtotal_amount - finalDiscount);
      finalRemaining = 0;
      finalPaymentStatus = 'PAGO';
    }

    const deliveryRecord: Delivery = {
      id: `del-${Date.now()}`,
      tenant_id: entry.tenant_id,
      entry_id: payload.entryId,
      delivered_at: now,
      delivered_by: payload.attendantId,
      delivered_by_name: payload.attendantName,
      receiver_name: payload.receiverName,
      receiver_document: payload.receiverDocument,
      receiver_relation: payload.receiverRelation || 'Próprio Cliente',
      payment_method: primaryMethod,
      payment_status: finalPaymentStatus,
      payments: payload.payments,
      amount_paid: payload.amountPaid,
      change_amount: payload.changeAmount || 0,
      remaining_amount: finalRemaining,
      paid_at: now,
      notes: payload.notes
    };

    data.entries[entryIdx] = {
      ...entry,
      discount_amount: finalDiscount,
      total_amount: finalTotal,
      payment_status: finalPaymentStatus,
      payment_method: primaryMethod,
      payments: payload.payments,
      amount_paid: payload.amountPaid,
      change_amount: payload.changeAmount || 0,
      remaining_amount: finalRemaining,
      paid_at: now,
      delivery_info: deliveryRecord
    };

    // Mark Cartridges in this Entry as ENTREGUE (and mark uncompleted as DESISTENCIA if forced)
    data.cartridges = data.cartridges.map((c: Cartridge) => {
      if (c.entry_id === payload.entryId) {
        const isUncompleted = ['AGUARDANDO_VERIFICACAO', 'EM_VERIFICACAO', 'AGUARDANDO_RECARGA', 'EM_RECARGA', 'AGUARDANDO_TESTE', 'EM_TESTE'].includes(c.status);
        const resultClassification = isUncompleted && c.result_classification === 'PENDENTE'
          ? ('DESISTENCIA' as ResultClassification)
          : c.result_classification;

        return {
          ...c,
          status: 'ENTREGUE',
          result_classification: resultClassification,
          technical_notes: isUncompleted && payload.forcedCloseReason 
            ? `${c.technical_notes ? c.technical_notes + ' | ' : ''}[Desistência/Baixa sem conclusão: ${payload.forcedCloseReason}]`
            : c.technical_notes,
          updated_at: now
        };
      }
      return c;
    });

    this.saveStoreData(data);

    const paymentSummary = payload.payments && payload.payments.length > 0
      ? payload.payments.map(p => `${p.method}: R$ ${p.amount.toFixed(2)}`).join(' + ')
      : `${primaryMethod}: R$ ${payload.amountPaid.toFixed(2)}`;

    const discountMsg = extraDiscount > 0 ? ` | Desconto Concedido: R$ ${extraDiscount.toFixed(2)}` : '';
    const forcedMsg = payload.forcedCloseReason ? ` | Encerrado por Desistência: ${payload.forcedCloseReason}` : '';

    this.logAudit({
      tenant_id: entry.tenant_id,
      user_id: payload.attendantId,
      user_name: payload.attendantName,
      action: 'BAIXA_ENTREGA',
      resource: 'cartridge_entries',
      resource_id: payload.entryId,
      details: `Comanda ${entry.entry_number} entregue para ${payload.receiverName} (${payload.receiverRelation || 'Cliente'}) | Pagamento (${paymentSummary})${discountMsg}${forcedMsg} | Troco: R$ ${(payload.changeAmount || 0).toFixed(2)}`
    });

    return data.entries[entryIdx];
  }

  // Reopen Completed Entry back to Workbench / Balcão
  static reopenEntry(entryId: string, reason: string, performedByName?: string): CartridgeEntry {
    const data = this.getStoreData();
    const entryIdx = data.entries.findIndex((e: CartridgeEntry) => e.id === entryId);
    if (entryIdx === -1) throw new Error('Comanda não encontrada.');

    const entry = data.entries[entryIdx];
    const now = new Date().toISOString();

    data.entries[entryIdx] = {
      ...entry,
      payment_status: 'PENDENTE',
      delivery_info: undefined,
      paid_at: undefined,
      updated_at: now
    };

    // Revert cartridges that were ENTREGUE back to ready or pending verification
    data.cartridges = data.cartridges.map((c: Cartridge) => {
      if (c.entry_id === entryId) {
        const isFinished = c.output_weight_grams && c.result_classification === 'OK';
        return {
          ...c,
          status: isFinished ? 'FINALIZADO' : 'AGUARDANDO_VERIFICACAO',
          updated_at: now
        };
      }
      return c;
    });

    this.saveStoreData(data);

    this.logAudit({
      tenant_id: entry.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'REABERTURA_COMANDA',
      resource: 'cartridge_entries',
      resource_id: entryId,
      details: `Comanda ${entry.entry_number} reaberta no sistema. Motivo: ${reason || 'Solicitação operacional'}`
    });

    return data.entries[entryIdx];
  }

  // Delete / Excluir Comanda and associated Cartridges
  static deleteEntry(entryId: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    const entryIdx = data.entries.findIndex((e: CartridgeEntry) => e.id === entryId);
    if (entryIdx === -1) throw new Error('Comanda não encontrada.');

    const entry = data.entries[entryIdx];
    const countCartridges = data.cartridges.filter((c: Cartridge) => c.entry_id === entryId).length;

    // Delete entry and its cartridges
    data.entries.splice(entryIdx, 1);
    data.cartridges = data.cartridges.filter((c: Cartridge) => c.entry_id !== entryId);

    this.saveStoreData(data);

    this.logAudit({
      tenant_id: entry.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'EXCLUSAO_COMANDA',
      resource: 'cartridge_entries',
      resource_id: entryId,
      details: `Comanda ${entry.entry_number} (${countCartridges} cartuchos) de ${entry.customer?.name || 'Cliente'} excluída definitivamente do sistema.`
    });

    return true;
  }
}

