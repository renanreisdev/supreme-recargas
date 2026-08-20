// ============================================================================
// SUPREME RECARGAS 2 - TYPES & DOMAIN INTERFACES
// Generic, Modular Multi-Tenant SaaS Architecture for Technical Services,
// Maintenance, Refills, Electronics and Workshops
// ============================================================================

export type UserRole = 'SUPER_ADMIN' | 'ADMINISTRADOR' | 'ATENDENTE' | 'TECNICO';

export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';

export type OrderStatus = 
  | 'ABERTA'
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_APROVACAO'
  | 'PRONTA'
  | 'ENTREGUE'
  | 'CANCELADA';

export type FinancialStatus = 
  | 'PENDENTE'
  | 'PAGO_PARCIAL'
  | 'PAGO'
  | 'ISENTO';

export type PaymentMethod = 
  | 'DINHEIRO' 
  | 'PIX' 
  | 'CARTAO_DEBITO' 
  | 'CARTAO_CREDITO' 
  | 'A_PRAZO' 
  | 'ISENTO';

export type PaymentStatus = FinancialStatus;

export type AttributeDataType = 
  | 'text' 
  | 'textarea' 
  | 'integer' 
  | 'decimal' 
  | 'boolean' 
  | 'select' 
  | 'multi_select' 
  | 'currency';

export type FieldDataType = 
  | 'decimal' 
  | 'text' 
  | 'textarea' 
  | 'checkbox' 
  | 'select';

export type StageType = 
  | 'RECEBIDO' 
  | 'EM_ANDAMENTO' 
  | 'AGUARDANDO_APROVACAO' 
  | 'CONCLUIDO' 
  | 'CANCELADO';

export type KanbanColumnColor = 
  | 'slate' 
  | 'amber' 
  | 'purple' 
  | 'blue' 
  | 'emerald' 
  | 'rose' 
  | 'teal' 
  | 'indigo';

export type BusinessTemplateKey = 
  | 'RECARGA_CARTUCHOS' 
  | 'ASSISTENCIA_INFORMATICA' 
  | 'ASSISTENCIA_CELULARES' 
  | 'FERRAMENTAS_MOTORES' 
  | 'OFICINA_GERAL';

// ============================================================================
// 1. SAAS, TENANCY & USERS
// ============================================================================

export interface Plan {
  id: string;
  name: string;
  code: string;
  description: string;
  max_users: number;
  monthly_price: number;
  extra_user_price: number;
  max_total_users?: number;
  max_administrators?: number;
  max_attendants?: number;
  max_technicians?: number;
  extra_attendant_price?: number;
  extra_technician_price?: number;
  extra_admin_price?: number;
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
  active_template_keys?: BusinessTemplateKey[];
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
  custom_max_users?: number;
  extra_users?: number;
  custom_price?: number;
  billing_cycle?: 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
  notes?: string;
  plan?: Plan;
}

export interface PermissionGroup {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  is_system_default?: boolean;
  default_role: UserRole;
  default_max_discount_percent?: number; // Limite de desconto padrão do grupo (ex: 10%, 20%, 100%)
  default_inactivity_timeout_minutes?: number; // Timeout de inatividade padrão do grupo em minutos (0 = desativado)
  permissions: Record<string, boolean>;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  group_id?: string;
  group_name?: string;
  avatar_url?: string;
  is_active: boolean;
  custom_permissions?: Record<string, boolean>;
  max_discount_percent?: number; // Limite de desconto personalizado do usuário (ex: 15%, 50%, 100%)
  
  // Single active session tracking per device
  active_session_token?: string;
  active_session_device?: string;
  active_session_ip?: string;
  active_session_at?: string;

  // Auto-logout inactivity timeout in minutes (e.g. 5, 10, 15, 30, 60, 120, 0 = disabled)
  inactivity_timeout_minutes?: number;

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
  phone_is_whatsapp?: boolean;
  secondary_phone?: string;
  secondary_phone_is_whatsapp?: boolean;
  whatsapp?: string;
  email?: string;
  company_name?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// 2. CATALOG: CATEGORIES, BRANDS, MODELS, VARIANTS & ATTRIBUTES
// ============================================================================

export interface CategoryCustomField {
  id: string;
  name: string; // e.g. "Cor / Tinta", "Voltagem", "Potência", "Armazenamento", "Memória RAM"
  type: 'select' | 'text' | 'number' | 'checkbox';
  unit?: string; // Unidade de medida para tipo number (ex: W, V, g, ml, GB, TB, HP, mm, kg)
  options?: string[]; // e.g. ["Preto", "Tricolor", "Ciano", "Magenta", "Amarelo"] or ["Bivolt", "110V", "220V", "Bateria"]
  include_in_description: boolean; // se essa opção deve compor a descrição do produto
  is_required?: boolean;
}

export interface ItemCategory {
  id: string;
  tenant_id?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  identifier_label?: string; // e.g. "Final de Série", "IMEI / Serial", "Nº de Série", "Placa / Chassi", "Patrimônio"
  inspection_type?: 'SCALE' | 'CHECKLIST' | 'STANDARD' | string;
  inspection_type_label?: string; // Rótulo customizado do tipo de inspeção
  checklist_items?: string[]; // Custom checklist items per category
  custom_fields?: CategoryCustomField[]; // Opcionais & Especificações Técnicas editáveis pelo usuário
  technical_verdicts?: string[]; // Pareceres Técnicos / Resultados customizados por categoria
  is_system?: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Brand {
  id: string;
  tenant_id?: string;
  name: string;
  slug: string;
  is_system?: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ItemAttributeDefinition {
  id: string;
  tenant_id?: string;
  category_id: string;
  name: string;
  key: string;
  data_type: AttributeDataType;
  unit?: string; // e.g., "g", "ml", "GB", "V", "W"
  options?: string[];
  is_required: boolean;
  is_filterable?: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface ItemModel {
  id: string;
  tenant_id: string;
  category_id: string;
  brand_id?: string;
  brand_name?: string;
  name: string;
  internal_code?: string;
  barcode?: string;
  description?: string;
  technical_notes?: string;
  
  // Specific technical attributes & optionals
  color?: string; // e.g. "Preto", "Tricolor", "Ciano", "Magenta", "Amarelo", "Cinza Espacial"
  is_xl?: boolean; // XL / Alta Capacidade
  capacity_ml?: number; // ml ou páginas
  empty_weight_grams?: number; // Peso vazio / Tara padrão (g)
  full_weight_grams?: number; // Peso cheio de referência (g)
  voltage?: string; // "110V", "220V", "Bivolt", "Bateria"
  power_specs?: string; // Ex: "750W", "12V 2Ah", "3.5 HP"
  hardware_specs?: string; // Ex: "Core i7, 16GB, SSD 512GB"
  recommended_accessories?: string; // Ex: "Carregador 65W original"
  service_prices?: Record<string, number>; // Preços específicos por serviço: { [serviceId]: customPrice }
  custom_checklist?: string[];

  attributes?: Record<string, any>;
  custom_attributes?: Record<string, any>; // Dynamic values for category custom_fields
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Relations
  category?: ItemCategory;
  brand?: Brand;
  variants?: ItemVariant[];
}

export interface ItemVariant {
  id: string;
  tenant_id: string;
  model_id: string;
  name: string; // e.g. "Preto Normal", "Preto XL", "Tricolor", "128GB Azul"
  sku?: string;
  attributes?: Record<string, any>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerAsset {
  id: string;
  tenant_id: string;
  customer_id: string;
  model_id: string;
  variant_id?: string;
  serial_number: string;
  nickname?: string;
  attributes?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  model?: ItemModel;
  variant?: ItemVariant;
  customer?: Customer;
}

// ============================================================================
// 3. SERVICES, PRICING, FIELD DEFINITIONS & RESULTS
// ============================================================================

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  default_price: number;
  estimated_time_minutes?: number;
  is_active: boolean;
  category_ids?: string[]; // Compatible category IDs
  created_at?: string;
  updated_at?: string;
}

export interface ServiceCategory {
  id: string;
  tenant_id: string;
  service_id: string;
  category_id: string;
}

export interface ServicePriceRule {
  id: string;
  tenant_id: string;
  service_id: string;
  category_id?: string;
  model_id?: string;
  variant_id?: string;
  price: number;
  promotional_price?: number;
  promo_start_date?: string;
  promo_end_date?: string;
}

export interface ServiceFieldDefinition {
  id: string;
  tenant_id?: string;
  service_id?: string;
  category_id?: string;
  label: string;
  field_key: string;
  field_type: FieldDataType;
  unit?: string;
  options?: string[];
  is_required: boolean;
  sort_order: number;
}

export interface ServiceResultDefinition {
  id: string;
  tenant_id?: string;
  category_id?: string;
  service_id?: string;
  code: string; // e.g., 'OK', 'CID', 'QUEIMADO', 'DEFEITO_PLACA', 'SEM_REPARO'
  label: string;
  description?: string;
  color?: string; // hex or badge color key
  is_approval: boolean;
  is_active: boolean;
}

// ============================================================================
// 4. WORKFLOW ENGINE & CHECKLISTS
// ============================================================================

export interface WorkflowTemplate {
  id: string;
  tenant_id?: string;
  category_id?: string;
  name: string;
  description?: string;
  is_default: boolean;
  states: WorkflowState[];
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowState {
  id: string;
  tenant_id?: string;
  workflow_id: string;
  code: string;
  name: string;
  color: KanbanColumnColor;
  stage_type: StageType;
  sort_order: number;
  is_initial: boolean;
  is_final: boolean;
  description?: string;
}

export interface WorkflowTransition {
  id: string;
  tenant_id?: string;
  workflow_id: string;
  from_state_id: string;
  to_state_id: string;
  allowed_roles?: UserRole[];
}

export interface ChecklistTemplateItem {
  id: string;
  item_name: string;
  is_required?: boolean;
  sort_order: number;
}

export interface ChecklistTemplate {
  id: string;
  tenant_id?: string;
  category_id?: string;
  name: string;
  description?: string;
  items: ChecklistTemplateItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ChecklistExecutionItem {
  item: string;
  checked: boolean;
  notes?: string;
}

// ============================================================================
// 5. SERVICE ORDERS, ITEMS, SERVICES & DELIVERIES
// ============================================================================

export interface ServiceOrderItemService {
  id: string;
  tenant_id: string;
  service_order_item_id: string;
  service_id: string;
  service_name?: string;
  technician_id?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  surcharge_amount: number;
  total_amount: number;
  status: 'PENDENTE' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'CANCELADO';
  field_data?: Record<string, any>; // Dynamic technical fields (e.g. input_weight, output_weight)
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceOrderItem {
  id: string;
  tenant_id: string;
  service_order_id: string;
  customer_asset_id?: string;
  category_id?: string;
  model_id: string;
  variant_id?: string;
  item_index: number;
  internal_identifier: string; // Serial / IMEI / Final de série
  reported_issue?: string;
  reception_notes?: string;
  technical_notes?: string;
  accessories?: string;
  checklist?: ChecklistExecutionItem[];
  custom_field_values?: Record<string, any>;
  
  current_state_id: string;
  status: string; // Code matching workflow state (e.g., 'RECEBIDO', 'EM_ANDAMENTO', 'FINALIZADO')
  result_id?: string;
  result_code?: string;
  result_description?: string;
  assigned_technician_id?: string;
  assigned_technician_name?: string;
  
  // Financial sub-totals for this item
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;

  received_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;

  // Relations
  model?: ItemModel;
  variant?: ItemVariant;
  technician?: Profile;
  services?: ServiceOrderItemService[];
  order_number?: string;
  customer_name?: string;
  customer?: Customer;
}

export interface PaymentSplit {
  id?: string;
  payment_method: PaymentMethod;
  amount: number;
  notes?: string;
  paid_at?: string;
  received_by?: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  service_order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  received_by: string; // Profile ID
  received_by_name?: string;
  paid_at: string;
  notes?: string;
  created_at: string;
}

export interface Delivery {
  id?: string;
  tenant_id?: string;
  service_order_id?: string;
  delivered_at: string;
  delivered_by: string;
  delivered_by_name?: string;
  receiver_name: string;
  receiver_document?: string;
  receiver_relation?: string; // 'Proprio Cliente', 'Funcionario', 'Familiar', 'Outro'
  notes?: string;
}

export interface ServiceOrder {
  id: string;
  tenant_id: string;
  order_number: string; // e.g., '2026-000001'
  order_sequence: number;
  order_year: number;
  customer_id: string;
  opened_by: string; // Profile ID
  opened_by_name?: string;
  assigned_technician_id?: string;
  assigned_technician_name?: string;
  opened_at: string;
  expected_at?: string;
  closed_at?: string;
  delivered_at?: string;
  
  status: OrderStatus;
  financial_status: FinancialStatus;
  
  subtotal_amount: number;
  discount_amount: number;
  surcharge_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  change_amount?: number;

  tracking_token: string;
  notes?: string;
  internal_notes?: string;

  // Relations & Sub-objects
  items?: ServiceOrderItem[];
  payments?: Payment[];
  delivery_info?: Delivery;
  customer?: Customer;
  attendant?: Profile;
  technician?: Profile;
  created_at: string;
  updated_at?: string;
}

export interface OrderStatusHistory {
  id: string;
  tenant_id: string;
  service_order_id: string;
  service_order_item_id?: string;
  from_status?: string;
  to_status: string;
  performed_by: string;
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

// ============================================================================
// 6. SETTINGS & BUSINESS TEMPLATES
// ============================================================================

export interface BusinessTemplate {
  key: BusinessTemplateKey;
  name: string;
  description: string;
  icon: string;
  categories: ItemCategory[];
  brands: Brand[];
  models: Partial<ItemModel>[];
  services: Partial<Service>[];
  attributes: Partial<ItemAttributeDefinition>[];
  fieldDefinitions: Partial<ServiceFieldDefinition>[];
  results: Partial<ServiceResultDefinition>[];
  workflow: Partial<WorkflowTemplate>;
  checklist?: Partial<ChecklistTemplate>;
}

export interface CompanySettings {
  id: string;
  tenant_id: string;
  active_templates?: BusinessTemplateKey[];
  require_customer_document: boolean;
  require_item_serial: boolean;
  require_cartridge_serial?: boolean;
  require_technician_on_entry?: boolean; // Se o técnico responsável é obrigatório na criação da comanda
  custom_checklist_items?: string[];
  allow_partial_delivery?: boolean;
  default_refill_price?: number;
  default_refill_xl_price?: number;
  default_verification_price?: number;
  default_test_price?: number;
  input_weight_responsibility?: 'ATENDENTE' | 'TECNICO' | 'AMBOS';
  waive_verification_if_refilled?: boolean;

  // SKU / Código Interno Configuration:
  sku_mode?: 'MANUAL' | 'AUTO_INCREMENT';
  sku_prefix?: string; // Prefixo, ex: "MOD-", "SKU-", "PROD-" ou ""
  sku_start_number?: number; // Padrão inicial, ex: 1, 100, 1000
  sku_current_number?: number; // Número atual de sequência
  sku_digits?: number; // Dígitos preenchidos com zero à esquerda, ex: 4 (0001)

  // Item Description Display Mode across views:
  item_description_display_mode?: 'BASIC' | 'FULL'; // 'BASIC' = nome do modelo; 'FULL' = descrição completa com opcionais

  // Grupos de Usuários autorizados a aparecer como Técnicos Responsáveis
  technician_group_ids?: string[]; // IDs dos PermissionGroups elegíveis como técnicos

  // Política Geral de Desconexão por Inatividade (minutos, 0 = desativado)
  default_inactivity_timeout_minutes?: number;

  // ==========================================================================
  // CONFIGURAÇÕES AVANÇADAS DE IMPRESSÃO & COMANDAS TÉRMICAS
  // ==========================================================================
  printer_paper_width?: '58mm' | '80mm';
  thermal_paper_width_mm: number;
  printer_font_size?: 'compact' | 'normal' | 'large'; // 'compact' (9px), 'normal' (11px), 'large' (13px)
  printer_density?: 'compact' | 'normal'; // Espaçamento entre seções do cupom

  // Quantidade de vias (cópias) na entrada e na saída:
  print_entry_copies?: 1 | 2; // 1 via (Única) ou 2 vias (1ª Via Loja/Bancada + 2ª Via Cliente)
  print_delivery_copies?: 0 | 1 | 2; // 0 = Não imprime, 1 = 1 via (Recibo Cliente), 2 = 2 vias (Loja + Cliente)

  // Automações de Disparo de Impressão:
  auto_print_on_entry?: boolean; // Disparar diálogo de impressão automaticamente ao abrir OS
  auto_print_on_delivery?: boolean; // Disparar diálogo de impressão automaticamente na entrega/baixa

  // Elementos e Seções Visíveis no Cupom:
  show_prices_on_receipt: boolean; // Exibir valores dos serviços e total
  show_qr_code_on_receipt?: boolean; // Exibir QR Code de rastreio online
  show_checklist_on_receipt?: boolean; // Exibir itens do checklist de conferência
  show_accessories_on_receipt?: boolean; // Exibir acessórios informados
  show_reported_issue_on_receipt?: boolean; // Exibir defeito/reclamação relatada
  show_technician_on_receipt?: boolean; // Exibir técnico responsável
  show_customer_signature_line?: boolean; // Exibir linha para assinatura do cliente
  show_attendant_signature_line?: boolean; // Exibir linha para assinatura do atendente/oficina
  show_company_cnpj?: boolean; // Exibir CNPJ no cabeçalho
  show_company_contact?: boolean; // Exibir telefone/whatsapp no cabeçalho
  show_company_address?: boolean; // Exibir endereço no cabeçalho

  // Textos Personalizados de Cabeçalho e Rodapé:
  receipt_header?: string; // Slogan ou mensagem institucional no topo
  receipt_header_note?: string;
  receipt_footer?: string; // Termos de garantia, prazos e condições legais (entrada)
  receipt_footer_note?: string;
  receipt_delivery_footer?: string; // Termos de quitação e retirada do equipamento (baixa)
}

// ============================================================================
// 7. BACKWARD-COMPATIBILITY ALIASES (Clean Transition Layer)
// ============================================================================

export type CartridgeEntry = ServiceOrder;
export type Cartridge = ServiceOrderItem;
export type CartridgeModel = ItemModel;
export type CartridgeBrand = Brand;
export type CartridgeStatus = string;
export type ResultClassification = string;
export type RequestedService = string;
export type BusinessSegment = BusinessTemplateKey;
export type ServicePrice = Service;

export interface SegmentCustomization {
  segment: BusinessTemplateKey;
  segmentName: string;
  itemLabelSingular: string;
  itemLabelPlural: string;
  identifierLabel: string;
  serviceLabel: string;
  hasWeightInspection: boolean;
  hasChecklist: boolean;
  defaultChecklistItems: string[];
  defaultCategories: string[];
  iconName?: string;
}

export interface KanbanColumnConfig {
  id: string;
  title: string;
  color: KanbanColumnColor;
  statuses: string[];
  description?: string;
}
