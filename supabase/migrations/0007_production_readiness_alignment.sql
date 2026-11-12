-- ============================================================================
-- MIGRATION 0007: PRODUCTION READINESS & FULL SCHEMA ALIGNMENT
-- Garante que todas as tabelas, colunas e políticas de acesso utilizadas pelo
-- AppStore (src/lib/store.ts) existam no PostgreSQL em Produção.
-- ============================================================================

-- 1. COMPANIES (Campos adicionais de segmento, termos LGPD e templates)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS responsible_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_segment TEXT DEFAULT 'RECARGA_CARTUCHOS';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS active_template_keys JSONB DEFAULT '["RECARGA_CARTUCHOS"]'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS terms_accepted_by TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- 2. PLANS & SUBSCRIPTIONS (Modelo unificado de usuários e recursos)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS extra_user_price NUMERIC(10, 2) DEFAULT 15.00;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS extra_users INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_max_users INTEGER;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_price NUMERIC(10, 2);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'MONTHLY';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. PERMISSION GROUPS (Garantia de criação e todas as colunas)
CREATE TABLE IF NOT EXISTS permission_groups (
  id TEXT PRIMARY KEY,
  tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
  default_role user_role NOT NULL DEFAULT 'ATENDENTE',
  default_max_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 10,
  default_inactivity_timeout_minutes INTEGER NOT NULL DEFAULT 0,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE permission_groups ADD COLUMN IF NOT EXISTS default_max_discount_percent NUMERIC(5, 2) DEFAULT 10;
ALTER TABLE permission_groups ADD COLUMN IF NOT EXISTS default_inactivity_timeout_minutes INTEGER DEFAULT 0;
ALTER TABLE permission_groups ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- 4. PROFILES (Autenticação customizada com hash SHA-256 + salt, permissões e sessão)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS group_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_discount_percent NUMERIC(5, 2) DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_session_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_session_device TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_session_ip TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_session_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS inactivity_timeout_minutes INTEGER NOT NULL DEFAULT 0;

-- 5. COMPANY SETTINGS (Regras operacionais, SKU, bobina térmica e impressão)
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS sku_mode TEXT DEFAULT 'MANUAL';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS sku_prefix TEXT DEFAULT 'MOD-';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS sku_digits INTEGER DEFAULT 4;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS sku_start_number INTEGER DEFAULT 1;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS sku_current_number INTEGER DEFAULT 1;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS require_customer_document BOOLEAN DEFAULT FALSE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS require_item_serial BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS require_cartridge_serial BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS require_technician_on_entry BOOLEAN DEFAULT FALSE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS auto_print_on_entry BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS auto_print_on_delivery BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS print_entry_copies INTEGER DEFAULT 2;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS print_delivery_copies INTEGER DEFAULT 1;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS printer_paper_width TEXT DEFAULT '80mm';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS printer_font_size TEXT DEFAULT 'normal';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS printer_density TEXT DEFAULT 'normal';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_qr_code_on_receipt BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_checklist_on_receipt BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_accessories_on_receipt BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_reported_issue_on_receipt BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_technician_on_receipt BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_customer_signature_line BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_attendant_signature_line BOOLEAN DEFAULT FALSE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_company_cnpj BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_company_contact BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_company_address BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS receipt_header TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS receipt_footer TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS receipt_delivery_footer TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS active_templates JSONB DEFAULT '["RECARGA_CARTUCHOS"]'::jsonb;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS technician_group_ids JSONB DEFAULT '["default-tech-group"]'::jsonb;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS item_description_display_mode TEXT DEFAULT 'BASIC';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS default_inactivity_timeout_minutes INTEGER NOT NULL DEFAULT 0;

-- 6. CUSTOMERS (WhatsApp, endereço completo e anonimização LGPD)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_is_whatsapp BOOLEAN DEFAULT TRUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS secondary_phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS secondary_phone_is_whatsapp BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_anonymized BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ;

-- 7. SERVICE ORDERS & ITEMS (Campos de entrega, técnico atribuído e resultados)
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS opened_by_name TEXT;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS assigned_technician_id UUID;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS assigned_technician_name TEXT;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS delivery_info JSONB;

ALTER TABLE service_order_items ADD COLUMN IF NOT EXISTS result_code TEXT;
ALTER TABLE service_order_items ADD COLUMN IF NOT EXISTS result_description TEXT;
ALTER TABLE service_order_items ADD COLUMN IF NOT EXISTS assigned_technician_name TEXT;

ALTER TABLE service_order_item_services ADD COLUMN IF NOT EXISTS service_name TEXT;

-- 8. AUDIT LOGS (Campos de auditoria legível)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details TEXT;

-- 9. CASH REGISTERS & MOVEMENTS (Frente de Caixa / PDV)
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opened_by UUID,
  opened_by_name TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_by UUID,
  closed_by_name TEXT,
  closed_at TIMESTAMPTZ,
  initial_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  closing_counted_cash NUMERIC(10, 2),
  closing_calculated_cash NUMERIC(10, 2),
  closing_difference NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'ABERTO',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_registers_tenant ON cash_registers(tenant_id, status);

CREATE TABLE IF NOT EXISTS cash_register_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'ABERTURA', 'SUPRIMENTO', 'SANGRIA', 'VENDA_ORDEM'
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  order_id UUID,
  order_number TEXT,
  description TEXT NOT NULL,
  performed_by UUID,
  performed_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_register ON cash_register_movements(register_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_tenant ON cash_register_movements(tenant_id);

-- 10. RLS PARA CASH REGISTERS
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation on cash_registers" ON cash_registers;
DROP POLICY IF EXISTS "Allow public access cash_registers" ON cash_registers;
CREATE POLICY "Allow public access cash_registers"
  ON cash_registers FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Tenant isolation on cash_register_movements" ON cash_register_movements;
DROP POLICY IF EXISTS "Allow public access cash_register_movements" ON cash_register_movements;
CREATE POLICY "Allow public access cash_register_movements"
  ON cash_register_movements FOR ALL
  USING (true)
  WITH CHECK (true);

