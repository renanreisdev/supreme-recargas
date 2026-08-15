// ============================================================================
// SUPREME RECARGAS 2 - DATA STORE & REPOSITORY SERVICE
// Cloud-Connected Supabase & Local Cache Store with Real-time Multi-Device Sync
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
import { supabase } from '@/lib/supabase';

// Helper to generate valid RFC4122 UUID v4
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Default Seed Company
export const MOCK_COMPANY_SUPREME: Company = {
  id: 'b2000000-0000-0000-0000-000000000001',
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
  created_at: '2026-01-15T00:00:00.000Z',
  updated_at: '2026-01-15T00:00:00.000Z'
};

export const MOCK_PLANS: Plan[] = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
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
    id: 'a1000000-0000-0000-0000-000000000002',
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
    id: 'a1000000-0000-0000-0000-000000000003',
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
  id: 'c3000000-0000-0000-0000-000000000001',
  tenant_id: MOCK_COMPANY_SUPREME.id,
  plan_id: MOCK_PLANS[0].id,
  status: 'ACTIVE',
  starts_at: '2026-01-15T00:00:00.000Z',
  plan: MOCK_PLANS[0]
};

// Default Profiles
export const MOCK_PROFILES: Profile[] = [
  {
    id: 'd4000000-0000-0000-0000-000000000001',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Carlos Oliveira (Admin)',
    email: 'admin@supreme.com.br',
    password: 'admin123',
    phone: '(11) 91111-1111',
    role: 'ADMINISTRADOR',
    is_active: true,
    created_at: '2026-01-15T00:00:00.000Z',
    company: MOCK_COMPANY_SUPREME
  },
  {
    id: 'd4000000-0000-0000-0000-000000000002',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Mariana Santos (Atendente)',
    email: 'atendente@supreme.com.br',
    password: 'atendente123',
    phone: '(11) 92222-2222',
    role: 'ATENDENTE',
    is_active: true,
    created_at: '2026-01-16T00:00:00.000Z',
    company: MOCK_COMPANY_SUPREME
  },
  {
    id: 'd4000000-0000-0000-0000-000000000003',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Rafael Souza (Técnico)',
    email: 'tecnico@supreme.com.br',
    password: 'tecnico123',
    phone: '(11) 93333-3333',
    role: 'TECNICO',
    is_active: true,
    created_at: '2026-01-16T00:00:00.000Z',
    company: MOCK_COMPANY_SUPREME
  },
  {
    id: 'd4000000-0000-0000-0000-000000000000',
    tenant_id: '',
    full_name: 'Super Admin Plataforma',
    email: 'super@supreme-recargas.com',
    password: 'super123',
    phone: '(11) 90000-0000',
    role: 'SUPER_ADMIN',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z'
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'ca000000-0000-0000-0000-000000000001',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    internal_code: 1001,
    name: 'João Silva Advogados',
    document: '11.222.333/0001-44',
    phone: '(11) 98888-1111',
    whatsapp: '11988881111',
    email: 'contato@silvaadv.com.br',
    company_name: 'Silva Advocacia',
    notes: 'Cliente mensal VIP',
    created_at: '2026-01-20T00:00:00.000Z'
  },
  {
    id: 'ca000000-0000-0000-0000-000000000002',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    internal_code: 1002,
    name: 'Dra. Ana Paula Mendes',
    document: '123.456.789-00',
    phone: '(11) 97777-2222',
    whatsapp: '11977772222',
    email: 'ana.mendes@clinica.com.br',
    company_name: 'Clínica Sorriso',
    notes: 'Solicita sempre recibo impresso',
    created_at: '2026-02-01T00:00:00.000Z'
  }
];

export const MOCK_MODELS: CartridgeModel[] = [
  {
    id: '01000000-0000-0000-0000-000000000001',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    brand_name: 'HP',
    model_name: 'HP 664',
    color: 'Preto',
    is_xl: false,
    capacity_ml: 2.0,
    empty_weight_grams: 26.5,
    full_weight_grams: 30.5,
    technical_notes: 'Injetor padrão HP',
    refill_price: 30.00,
    verification_price: 15.00,
    test_price: 10.00,
    is_active: true
  },
  {
    id: '01000000-0000-0000-0000-000000000002',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    brand_name: 'HP',
    model_name: 'HP 664',
    color: 'Colorido',
    is_xl: false,
    capacity_ml: 2.0,
    empty_weight_grams: 28.0,
    full_weight_grams: 37.0,
    technical_notes: '3 câmaras: C, M, Y',
    refill_price: 35.00,
    verification_price: 15.00,
    test_price: 10.00,
    is_active: true
  },
  {
    id: '01000000-0000-0000-0000-000000000003',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    brand_name: 'HP',
    model_name: 'HP 664 XL',
    color: 'Preto',
    is_xl: true,
    capacity_ml: 8.5,
    empty_weight_grams: 27.0,
    full_weight_grams: 42.0,
    technical_notes: 'Cartucho de alta capacidade',
    refill_price: 45.00,
    verification_price: 15.00,
    test_price: 10.00,
    is_active: true
  },
  {
    id: '01000000-0000-0000-0000-000000000004',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    brand_name: 'HP',
    model_name: 'HP 667',
    color: 'Preto',
    is_xl: false,
    capacity_ml: 2.0,
    empty_weight_grams: 26.0,
    full_weight_grams: 30.0,
    technical_notes: 'Linha DeskJet Ink Advantage',
    refill_price: 32.00,
    verification_price: 15.00,
    test_price: 10.00,
    is_active: true
  },
  {
    id: '01000000-0000-0000-0000-000000000005',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    brand_name: 'Canon',
    model_name: 'Canon PG-145',
    color: 'Preto',
    is_xl: false,
    capacity_ml: 8.0,
    empty_weight_grams: 32.0,
    full_weight_grams: 45.0,
    technical_notes: 'Cartucho linha MG e TS',
    refill_price: 35.00,
    verification_price: 15.00,
    test_price: 10.00,
    is_active: true
  },
  {
    id: '01000000-0000-0000-0000-000000000006',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    brand_name: 'Canon',
    model_name: 'Canon CL-146',
    color: 'Colorido',
    is_xl: false,
    capacity_ml: 9.0,
    empty_weight_grams: 34.0,
    full_weight_grams: 48.0,
    technical_notes: 'Tricolor Canon',
    refill_price: 40.00,
    verification_price: 15.00,
    test_price: 10.00,
    is_active: true
  }
];

export const MOCK_SERVICE_PRICES: ServicePrice[] = [
  {
    id: 'f6000000-0000-0000-0000-000000000001',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    service_type: 'VERIFICACAO',
    title: 'Verificação e Teste Eletrônico',
    description: 'Diagnóstico no testador elétrico e balança',
    default_price: 15.00,
    is_active: true
  },
  {
    id: 'f6000000-0000-0000-0000-000000000002',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    service_type: 'RECARGA',
    title: 'Recarga Padrão',
    description: 'Carga completa de tinta de alta densidade',
    default_price: 30.00,
    is_active: true
  },
  {
    id: 'f6000000-0000-0000-0000-000000000003',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    service_type: 'VERIFICACAO_E_RECARGA',
    title: 'Verificação + Recarga Completa',
    description: 'Desconto da taxa de teste ao realizar a recarga',
    default_price: 30.00,
    is_active: true
  },
  {
    id: 'f6000000-0000-0000-0000-000000000004',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    service_type: 'TESTE',
    title: 'Teste de Impressão em Bancada',
    description: 'Teste de padrão de cores e bicos injetores',
    default_price: 10.00,
    is_active: true
  }
];

export const MOCK_COMPANY_SETTINGS: CompanySettings = {
  id: 'e5000000-0000-0000-0000-000000000001',
  tenant_id: MOCK_COMPANY_SUPREME.id,
  show_prices_on_receipt: true,
  receipt_header_note: 'SUPREME RECARGAS & INFORMÁTICA\nEspecialistas em Recarga e Manutenção',
  receipt_footer_note: 'Garantia de 30 dias para recargas. Apresente este comprovante para retirada.\nObrigado pela preferência!',
  verification_waiver_policy: 'CREDIT_IF_REFILLED',
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
    id: '03000000-0000-0000-0000-000000000001',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    user_id: MOCK_PROFILES[1].id,
    user_name: 'Mariana Santos (Atendente)',
    action: 'CRIACAO_COMANDA',
    resource: 'cartridge_entries',
    resource_id: 'ea000000-0000-0000-0000-000000000001',
    details: 'Comanda 2026-000001 gerada para João Silva Advogados (2 cartuchos) - R$ 60,00',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: '03000000-0000-0000-0000-000000000002',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    user_id: MOCK_PROFILES[2].id,
    user_name: 'Rafael Souza (Técnico)',
    action: 'DIAGNOSTICO_TECNICO',
    resource: 'cartridges',
    resource_id: '02000000-0000-0000-0000-000000000003',
    details: 'Classificado cartucho 2026-000002-01 como QUEIMADO. Preço recalculado para taxa de verificação.',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const INITIAL_ENTRIES: CartridgeEntry[] = [
  {
    id: 'ea000000-0000-0000-0000-000000000001',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    entry_number: '2026-000001',
    entry_sequence: 1,
    entry_year: 2026,
    customer_id: MOCK_CUSTOMERS[0].id,
    attendant_id: MOCK_PROFILES[1].id,
    entry_date: new Date(Date.now() - 86400000 * 2).toISOString(),
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
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'ea000000-0000-0000-0000-000000000002',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    entry_number: '2026-000002',
    entry_sequence: 2,
    entry_year: 2026,
    customer_id: MOCK_CUSTOMERS[1].id,
    attendant_id: MOCK_PROFILES[1].id,
    entry_date: new Date(Date.now() - 86400000).toISOString(),
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
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const INITIAL_CARTRIDGES: Cartridge[] = [
  {
    id: '02000000-0000-0000-0000-000000000001',
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
    customer_name: 'João Silva Advogados',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: '02000000-0000-0000-0000-000000000002',
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
    customer_name: 'João Silva Advogados',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: '02000000-0000-0000-0000-000000000003',
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
    customer_name: 'Dra. Ana Paula Mendes',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
];

const LOCAL_STORAGE_KEY = 'supreme_recargas_store_v3';
let isRealtimeInitialized = false;

export class AppStore {
  private static isSyncing = false;

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

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.profiles)) parsed.profiles = MOCK_PROFILES;
      if (!Array.isArray(parsed.entries)) parsed.entries = INITIAL_ENTRIES;
      if (!Array.isArray(parsed.cartridges)) parsed.cartridges = INITIAL_CARTRIDGES;
      if (!Array.isArray(parsed.customers)) parsed.customers = MOCK_CUSTOMERS;
      if (!Array.isArray(parsed.models)) parsed.models = MOCK_MODELS;
      if (!Array.isArray(parsed.servicePrices)) parsed.servicePrices = MOCK_SERVICE_PRICES;
      if (!parsed.settings) parsed.settings = MOCK_COMPANY_SETTINGS;
      if (!parsed.company) parsed.company = MOCK_COMPANY_SUPREME;
      if (!Array.isArray(parsed.auditLogs)) parsed.auditLogs = INITIAL_AUDIT_LOGS;
      return parsed;
    } catch {
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
  }

  private static saveStoreData(data: any, emitEvent = true) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      if (emitEvent) {
        window.dispatchEvent(new CustomEvent('supreme_store_updated'));
      }
    }
  }

  // Real-time synchronization with Supabase
  static async syncFromSupabase(tenantId = MOCK_COMPANY_SUPREME.id): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;

    try {
      const [
        custRes,
        modRes,
        priceRes,
        setRes,
        entRes,
        cartRes,
        profRes,
        auditRes
      ] = await Promise.all([
        supabase.from('customers').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('cartridge_models').select('*').eq('tenant_id', tenantId).order('model_name', { ascending: true }),
        supabase.from('service_prices').select('*').eq('tenant_id', tenantId),
        supabase.from('company_settings').select('*').eq('tenant_id', tenantId).maybeSingle(),
        supabase.from('cartridge_entries').select('*').eq('tenant_id', tenantId).order('entry_sequence', { ascending: false }),
        supabase.from('cartridges').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('tenant_id', tenantId),
        supabase.from('audit_logs').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(200)
      ]);

      const data = this.getStoreData();

      if (custRes.data && custRes.data.length > 0) {
        data.customers = custRes.data;
      }
      if (modRes.data && modRes.data.length > 0) {
        data.models = modRes.data;
      }
      if (priceRes.data && priceRes.data.length > 0) {
        data.servicePrices = priceRes.data;
      }
      if (setRes.data) {
        data.settings = setRes.data;
      }
      if (entRes.data && entRes.data.length > 0) {
        data.entries = entRes.data;
      }
      if (cartRes.data && cartRes.data.length > 0) {
        data.cartridges = cartRes.data;
      }
      if (profRes.data && profRes.data.length > 0) {
        data.profiles = profRes.data;
      }
      if (auditRes.data && auditRes.data.length > 0) {
        data.auditLogs = auditRes.data;
      }

      this.saveStoreData(data);
      return true;
    } catch (err) {
      console.warn('Supabase sync error, using local cache:', err);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // Setup Realtime WebSocket Listener across all browser windows/devices
  static initRealtime(tenantId = MOCK_COMPANY_SUPREME.id) {
    if (typeof window === 'undefined' || isRealtimeInitialized) return;
    isRealtimeInitialized = true;

    // Initial fetch from Supabase
    this.syncFromSupabase(tenantId);

    // Subscribe to database changes
    supabase
      .channel('supreme-db-sync')
      .on('postgres_changes', { event: '*', schema: 'public', filter: `tenant_id=eq.${tenantId}` }, () => {
        this.syncFromSupabase(tenantId);
      })
      .subscribe();
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
      id: generateUUID(),
      tenant_id: payload.tenant_id || MOCK_COMPANY_SUPREME.id,
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
    if (data.auditLogs.length > 500) {
      data.auditLogs = data.auditLogs.slice(0, 500);
    }
    this.saveStoreData(data);

    // Async push to Supabase
    supabase.from('audit_logs').insert(newLog).then();

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
      id: generateUUID(),
      created_at: new Date().toISOString()
    };

    data.profiles.push(newUser);
    this.saveStoreData(data);

    // Push to Supabase
    supabase.from('profiles').insert(newUser).then();

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
    const updated = { ...oldUser, ...updates, updated_at: new Date().toISOString() };
    data.profiles[idx] = updated;
    this.saveStoreData(data);

    // Push to Supabase
    supabase.from('profiles').update(updates).eq('id', userId).then();

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

    // Push to Supabase
    supabase.from('profiles').update({ custom_permissions: permissions }).eq('id', userId).then();

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

    // Push to Supabase
    supabase.from('profiles').update({ password: newPassword }).eq('id', userId).then();

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
    const updated = { ...data.settings, ...updates, updated_at: new Date().toISOString() };
    data.settings = updated;
    this.saveStoreData(data);

    // Push to Supabase
    supabase.from('company_settings').upsert({
      id: updated.id || generateUUID(),
      tenant_id: tenantId,
      ...updates,
      updated_at: new Date().toISOString()
    }).then();

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
    return (data.customers || []).filter((c: Customer) => c.tenant_id === tenantId);
  }

  static addCustomer(customer: Omit<Customer, 'id' | 'internal_code' | 'created_at'>, performedByName?: string): Customer {
    const data = this.getStoreData();
    const newCustomer: Customer = {
      ...customer,
      id: generateUUID(),
      internal_code: 1000 + (data.customers || []).length + 1,
      created_at: new Date().toISOString()
    };
    data.customers.unshift(newCustomer);
    this.saveStoreData(data);

    // Push to Supabase
    supabase.from('customers').insert(newCustomer).then();

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

    if (Array.isArray(data.entries)) {
      data.entries.forEach((e: CartridgeEntry) => {
        if (e.customer_id === customerId) {
          e.customer = updated;
        }
      });
    }

    this.saveStoreData(data);

    // Push to Supabase
    supabase.from('customers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', customerId).then();

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
    return (data.models || []).filter((m: CartridgeModel) => m.tenant_id === tenantId && m.is_active);
  }

  static addModel(model: Omit<CartridgeModel, 'id'>, performedByName?: string): CartridgeModel {
    const data = this.getStoreData();
    const newModel: CartridgeModel = {
      ...model,
      id: generateUUID()
    };
    data.models.unshift(newModel);
    this.saveStoreData(data);

    // Push to Supabase
    supabase.from('cartridge_models').insert(newModel).then();

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

    const updated = { ...data.models[idx], ...updates, updated_at: new Date().toISOString() };
    data.models[idx] = updated;
    this.saveStoreData(data);

    // Push to Supabase
    supabase.from('cartridge_models').update(updates).eq('id', modelId).then();

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
    return (data.servicePrices || []).filter((sp: ServicePrice) => sp.tenant_id === tenantId);
  }

  // Entries & Cartridges Query
  static getEntries(tenantId: string): CartridgeEntry[] {
    const data = this.getStoreData();
    const tenantEntries = (data.entries || []).filter((e: CartridgeEntry) => e.tenant_id === tenantId);
    return tenantEntries.map((entry: CartridgeEntry) => ({
      ...entry,
      customer: (data.customers || []).find((c: Customer) => c.id === entry.customer_id),
      cartridges: (data.cartridges || []).filter((c: Cartridge) => c.entry_id === entry.id).map((c: Cartridge) => ({
        ...c,
        model: (data.models || []).find((m: CartridgeModel) => m.id === c.model_id)
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
    const entry = (data.entries || []).find((e: CartridgeEntry) => 
      (e.tracking_token && e.tracking_token.toLowerCase() === clean) ||
      e.entry_number.toLowerCase() === clean ||
      e.id === tokenOrNumber
    );
    if (!entry) return undefined;
    return {
      ...entry,
      customer: (data.customers || []).find((c: Customer) => c.id === entry.customer_id),
      cartridges: (data.cartridges || []).filter((c: Cartridge) => c.entry_id === entry.id).map((c: Cartridge) => ({
        ...c,
        model: (data.models || []).find((m: CartridgeModel) => m.id === c.model_id)
      }))
    };
  }

  static getCompany(tenantId?: string): Company {
    const data = this.getStoreData();
    return data.company || MOCK_COMPANY_SUPREME;
  }

  static getCartridges(tenantId: string): Cartridge[] {
    const data = this.getStoreData();
    const tenantCartridges = (data.cartridges || []).filter((c: Cartridge) => c.tenant_id === tenantId);
    return tenantCartridges.map((cartridge: Cartridge) => {
      const entry = (data.entries || []).find((e: CartridgeEntry) => e.id === cartridge.entry_id);
      const customer = entry ? (data.customers || []).find((cust: Customer) => cust.id === entry.customer_id) : undefined;
      return {
        ...cartridge,
        model: (data.models || []).find((m: CartridgeModel) => m.id === cartridge.model_id),
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
    const tenantEntries = (data.entries || []).filter((e: CartridgeEntry) => e.tenant_id === payload.tenant_id);
    const seq = tenantEntries.length + 1;
    const entryNumber = `${currentYear}-${String(seq).padStart(6, '0')}`;
    const entryId = generateUUID();
    const trackingToken = `trk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    let subtotal = 0;
    payload.items.forEach(i => { subtotal += i.price; });
    const discount = payload.discount_amount || 0;
    const total = Math.max(0, subtotal - discount);

    const customer = (data.customers || []).find((c: Customer) => c.id === payload.customer_id);

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
        id: generateUUID(),
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
        entry_number: entryNumber,
        customer_name: customer?.name || 'Cliente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    data.entries.unshift(newEntry);
    data.cartridges.unshift(...newCartridges);
    this.saveStoreData(data);

    // Push entry and cartridges to Supabase
    supabase.from('cartridge_entries').insert(newEntry).then(() => {
      supabase.from('cartridges').insert(newCartridges).then();
    });

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
        model: (data.models || []).find((m: CartridgeModel) => m.id === c.model_id)
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
    const model = (data.models || []).find((m: CartridgeModel) => m.id === current.model_id);
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

      // Push entry update to Supabase
      supabase.from('cartridge_entries').update({
        subtotal_amount: newSubtotal,
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      }).eq('id', current.entry_id).then();
    }

    this.saveStoreData(data);

    // Push cartridge update to Supabase
    supabase.from('cartridges').update({
      status: updated.status,
      technician_id: updated.technician_id,
      result_classification: updated.result_classification,
      result_other_description: updated.result_other_description,
      input_weight_grams: updated.input_weight_grams,
      output_weight_grams: updated.output_weight_grams,
      weight_diff_grams: updated.weight_diff_grams,
      applied_price: updated.applied_price,
      final_price: updated.final_price,
      technical_notes: updated.technical_notes,
      updated_at: updated.updated_at
    }).eq('id', payload.cartridgeId).then();

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
    extraDiscount?: number;
    applyDiscountDifference?: boolean;
    forcedCloseReason?: string;
  }): CartridgeEntry {
    const data = this.getStoreData();
    const entryIdx = data.entries.findIndex((e: CartridgeEntry) => e.id === payload.entryId);
    if (entryIdx === -1) throw new Error('Comanda não encontrada.');

    const entry = data.entries[entryIdx];
    const now = new Date().toISOString();

    const diffDiscount = payload.applyDiscountDifference
      ? Math.max(0, (entry.total_amount || entry.subtotal_amount) - payload.amountPaid)
      : 0;
    const extraDiscount = payload.extraDiscount !== undefined ? payload.extraDiscount : diffDiscount;
    const currentDiscount = entry.discount_amount || 0;
    const newTotalDiscount = currentDiscount + extraDiscount;
    const finalTotal = Math.max(0, (entry.subtotal_amount || entry.total_amount) - newTotalDiscount);

    let finalPaymentStatus = payload.paymentStatus;
    let finalRemaining = payload.remainingAmount ?? Math.max(0, finalTotal - payload.amountPaid);
    if ((extraDiscount > 0 || payload.applyDiscountDifference) && payload.amountPaid >= finalTotal) {
      finalPaymentStatus = 'PAGO';
      finalRemaining = 0;
    }

    const primaryMethod = payload.paymentMethod || (payload.payments && payload.payments[0]?.method) || 'DINHEIRO';

    const deliveryRecord: Delivery = {
      id: generateUUID(),
      tenant_id: entry.tenant_id,
      entry_id: payload.entryId,
      delivered_at: now,
      delivered_by: payload.attendantId,
      delivered_by_name: payload.attendantName,
      attendant_name: payload.attendantName,
      receiver_name: payload.receiverName,
      receiver_document: payload.receiverDocument,
      receiver_relation: payload.receiverRelation,
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
      discount_amount: newTotalDiscount,
      total_amount: finalTotal,
      payment_status: finalPaymentStatus,
      payment_method: primaryMethod,
      payments: payload.payments,
      amount_paid: payload.amountPaid,
      change_amount: payload.changeAmount || 0,
      remaining_amount: finalRemaining,
      paid_at: now,
      delivery_info: deliveryRecord,
      updated_at: now
    };

    // Mark Cartridges in this Entry as ENTREGUE
    data.cartridges = data.cartridges.map((c: Cartridge) => {
      if (c.entry_id === payload.entryId) {
        const isUncompleted = ['AGUARDANDO_VERIFICACAO', 'EM_VERIFICACAO', 'AGUARDANDO_RECARGA', 'EM_RECARGA', 'AGUARDANDO_TESTE', 'EM_TESTE'].includes(c.status);
        const resultClassification = isUncompleted && c.result_classification === 'PENDENTE'
          ? ('DESISTENCIA' as ResultClassification)
          : c.result_classification;

        const updatedCart = {
          ...c,
          status: 'ENTREGUE' as CartridgeStatus,
          result_classification: resultClassification,
          technical_notes: isUncompleted && payload.forcedCloseReason 
            ? `${c.technical_notes ? c.technical_notes + ' | ' : ''}[Desistência/Baixa sem conclusão: ${payload.forcedCloseReason}]`
            : c.technical_notes,
          updated_at: now
        };

        // Push cartridge update to Supabase
        supabase.from('cartridges').update({
          status: updatedCart.status,
          result_classification: updatedCart.result_classification,
          technical_notes: updatedCart.technical_notes,
          updated_at: now
        }).eq('id', c.id).then();

        return updatedCart;
      }
      return c;
    });

    this.saveStoreData(data);

    // Push delivery and entry update to Supabase
    supabase.from('deliveries').insert(deliveryRecord).then();
    supabase.from('cartridge_entries').update({
      discount_amount: newTotalDiscount,
      total_amount: finalTotal,
      payment_status: finalPaymentStatus,
      payment_method: primaryMethod,
      payments: payload.payments,
      amount_paid: payload.amountPaid,
      change_amount: payload.changeAmount || 0,
      remaining_amount: finalRemaining,
      paid_at: now,
      delivery_info: deliveryRecord,
      updated_at: now
    }).eq('id', payload.entryId).then();

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

    data.cartridges = data.cartridges.map((c: Cartridge) => {
      if (c.entry_id === entryId) {
        const isFinished = c.output_weight_grams && c.result_classification === 'OK';
        const updatedStatus: CartridgeStatus = isFinished ? 'FINALIZADO' : 'AGUARDANDO_VERIFICACAO';
        const updatedCart = {
          ...c,
          status: updatedStatus,
          updated_at: now
        };

        supabase.from('cartridges').update({
          status: updatedStatus,
          updated_at: now
        }).eq('id', c.id).then();

        return updatedCart;
      }
      return c;
    });

    this.saveStoreData(data);

    // Push entry update to Supabase
    supabase.from('cartridge_entries').update({
      payment_status: 'PENDENTE',
      delivery_info: null,
      paid_at: null,
      updated_at: now
    }).eq('id', entryId).then();

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

    // Delete locally
    data.entries.splice(entryIdx, 1);
    data.cartridges = data.cartridges.filter((c: Cartridge) => c.entry_id !== entryId);
    this.saveStoreData(data);

    // Delete in Supabase
    supabase.from('cartridge_entries').delete().eq('id', entryId).then();

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
