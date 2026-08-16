// ============================================================================
// SUPREME RECARGAS 2 - TYPES & INTERFACES
// Core TypeScript Definitions for SaaS Multi-Tenant Architecture
// ============================================================================

export type UserRole = 'SUPER_ADMIN' | 'ADMINISTRADOR' | 'ATENDENTE' | 'TECNICO';

export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';

export type RequestedService = 
  | 'VERIFICACAO' 
  | 'RECARGA' 
  | 'VERIFICACAO_E_RECARGA' 
  | 'TESTE' 
  | 'OUTRO';

export type CartridgeStatus = 
  | 'RECEBIDO'
  | 'AGUARDANDO_VERIFICACAO'
  | 'EM_VERIFICACAO'
  | 'AGUARDANDO_RECARGA'
  | 'EM_RECARGA'
  | 'AGUARDANDO_TESTE'
  | 'EM_TESTE'
  | 'FINALIZADO'
  | 'ENTREGUE'
  | 'COM_PROBLEMA'
  | 'SEM_REPARO'
  | 'CANCELADO';

export type ResultClassification = 
  | 'PENDENTE'
  | 'OK'
  | 'CID'
  | 'QUEIMADO'
  | 'FALHA_IMPRESSAO'
  | 'ENTUPIDO'
  | 'SEM_REPARO'
  | 'DESISTENCIA'
  | 'OUTRO';

export type PaymentMethod = 
  | 'DINHEIRO' 
  | 'PIX' 
  | 'CARTAO_DEBITO' 
  | 'CARTAO_CREDITO' 
  | 'A_PRAZO' 
  | 'ISENTO';

export type PaymentStatus = 
  | 'PAGO' 
  | 'PENDENTE' 
  | 'ISENTO';

export type BusinessSegment = 
  | 'RECARGA_CARTUCHOS' 
  | 'ASSISTENCIA_CELULARES_INFORMATICA' 
  | 'FERRAMENTAS_MOTORES' 
  | 'OFICINA_GERAL';

export interface SegmentCustomization {
  segment: BusinessSegment;
  segmentName: string;
  itemLabelSingular: string; // "Cartucho", "Aparelho", "Equipamento", "Item"
  itemLabelPlural: string;   // "Cartuchos", "Aparelhos", "Equipamentos", "Itens"
  identifierLabel: string;   // "Final de Série", "IMEI / Serial", "Nº de Série", "Código"
  serviceLabel: string;      // "Serviço Solicitado", "Tipo de Manutenção"
  hasWeightInspection: boolean; // Balança / Pesagem em gramas
  hasChecklist: boolean;     // Checklist de Inspeção
  defaultChecklistItems: string[];
  defaultCategories: string[];
  iconName?: string;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  description: string;
  max_administrators: number;
  max_attendants: number;
  max_technicians: number;
  max_total_users?: number;
  monthly_price: number;
  extra_attendant_price: number;
  extra_technician_price: number;
  extra_admin_price: number;
  features?: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  corporate_name: string;
  trade_name: string;
  cnpj: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  responsible_name?: string;
  logo_url?: string;
  business_segment?: BusinessSegment;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string;
  expires_at?: string;
  custom_max_administrators?: number;
  custom_max_attendants?: number;
  custom_max_technicians?: number;
  extra_attendants?: number;
  extra_technicians?: number;
  extra_administrators?: number;
  custom_price?: number;
  billing_cycle?: 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
  notes?: string;
  plan?: Plan;
}

export interface PaymentSplit {
  id?: string;
  method: PaymentMethod;
  amount: number;
  notes?: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  custom_permissions?: Record<string, boolean>;
  created_at: string;
  company?: Company;
}

export interface Customer {
  id: string;
  tenant_id: string;
  internal_code: number;
  name: string;
  document?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  company_name?: string;
  notes?: string;
  created_at: string;
}

export interface CartridgeBrand {
  id: string;
  tenant_id: string;
  name: string;
}

export interface CartridgeModel {
  id: string;
  tenant_id: string;
  brand_id?: string;
  brand_name?: string;
  model_name: string;
  category?: string; // e.g., 'Smartphones', 'Notebooks', 'Cartuchos', 'Ferramentas'
  color: string;
  is_xl: boolean;
  capacity_ml?: number;
  empty_weight_grams?: number;
  full_weight_grams?: number;
  technical_notes?: string;
  refill_price?: number;
  verification_price?: number;
  test_price?: number;
  is_active: boolean;
}

export type KanbanColumnColor = 'amber' | 'purple' | 'blue' | 'emerald' | 'rose' | 'indigo' | 'slate' | 'teal';

export interface KanbanColumnConfig {
  id: string;
  title: string;
  color: KanbanColumnColor;
  statuses: CartridgeStatus[];
  description?: string;
}

export interface ServicePrice {
  id: string;
  tenant_id: string;
  service_type: RequestedService | string;
  title: string;
  description?: string;
  default_price: number;
  estimated_time_minutes?: number;
  category?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartridgeModelPrice {
  id: string;
  tenant_id: string;
  model_id: string;
  service_type: RequestedService;
  price: number;
  promotional_price?: number;
}

export interface Delivery {
  id?: string;
  tenant_id?: string;
  entry_id?: string;
  delivered_at: string;
  delivered_by: string; // Attendant user ID
  receiver_name: string;
  receiver_document?: string;
  receiver_relation?: string; // 'Proprio Cliente', 'Funcionario', 'Familiar', 'Outro'
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  payments?: PaymentSplit[];
  amount_paid?: number;
  change_amount?: number;
  remaining_amount?: number;
  paid_at?: string;
  notes?: string;
  delivered_by_name?: string;
  attendant_name?: string;
}

export interface CartridgeEntry {
  id: string;
  tenant_id: string;
  entry_number: string; // e.g., '2026-000001'
  entry_sequence: number;
  entry_year: number;
  customer_id: string;
  attendant_id: string;
  entry_date: string;
  subtotal_amount: number;
  discount_amount: number;
  surcharge_amount: number;
  total_amount: number;
  general_notes?: string;
  tracking_token: string;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  payments?: PaymentSplit[];
  amount_paid?: number;
  change_amount?: number;
  remaining_amount?: number;
  paid_at?: string;
  delivery_info?: Delivery;
  customer?: Customer;
  attendant?: Profile;
  cartridges?: Cartridge[];
  created_at: string;
}

export interface Cartridge {
  id: string;
  tenant_id: string;
  entry_id: string;
  serial_number: string; // e.g., '2026-000001-01'
  item_index: number;
  model_id: string;
  service_requested: RequestedService;
  color: string;
  is_xl: boolean;
  final_serie: string;
  status: CartridgeStatus;
  result_classification: ResultClassification;
  result_other_description?: string;
  
  technician_id?: string;
  input_weight_grams?: number;
  output_weight_grams?: number;
  weight_diff_grams?: number;
  reception_notes?: string;
  technical_notes?: string;
  accessories?: string; // e.g., 'Cabo carregador + capinha' or 'Maleta + 2 brocas'
  checklist?: Array<{ item: string; checked: boolean; notes?: string }>;
  custom_fields?: Record<string, any>;
  
  original_price: number;
  applied_price: number;
  discount_amount: number;
  surcharge_amount: number;
  final_price: number;
  price_override_reason?: string;
  price_modified_by?: string;

  model?: CartridgeModel;
  technician?: Profile;
  entry_number?: string;
  customer_name?: string;
  customer?: Customer;
  created_at: string;
  updated_at: string;
}

export interface CartridgeStatusHistory {
  id: string;
  tenant_id: string;
  cartridge_id: string;
  previous_status?: CartridgeStatus;
  new_status: CartridgeStatus;
  changed_by: string;
  changed_by_profile?: Profile;
  notes?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  user_name?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  created_at: string;
}

export interface CompanySettings {
  id: string;
  tenant_id: string;
  business_segment?: BusinessSegment;
  segment_config?: SegmentCustomization;
  show_prices_on_receipt: boolean;
  receipt_header_note?: string;
  receipt_footer_note?: string;
  verification_waiver_policy: 'ALWAYS_CHARGE' | 'WAIVE_IF_REFILLED' | 'CREDIT_IF_REFILLED';
  waive_verification_if_refilled: boolean;
  default_refill_price: number;
  default_refill_xl_price: number;
  default_verification_price: number;
  default_test_price: number;
  input_weight_responsibility: 'ATENDENTE' | 'TECNICO' | 'AMBOS';
  thermal_paper_width_mm: number;
  require_customer_document: boolean; // Define se CPF/CNPJ é obrigatório no cadastro de clientes
  require_cartridge_serial: boolean;  // Define se o número/final de série do cartucho é obrigatório na entrada
  custom_checklist_items?: string[];
  kanban_columns?: KanbanColumnConfig[];
}

