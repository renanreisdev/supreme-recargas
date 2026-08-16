-- ============================================================================
-- SUPREME RECARGAS 2 - MIGRATION 0004: GENERIC TECHNICAL SERVICE & REPAIR PLATFORM
-- Transforms architecture from cartridge-specific to generic modular SaaS
-- ============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'ABERTA',
        'EM_ANDAMENTO',
        'AGUARDANDO_APROVACAO',
        'PRONTA',
        'ENTREGUE',
        'CANCELADA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE financial_status AS ENUM (
        'PENDENTE',
        'PAGO_PARCIAL',
        'PAGO',
        'ISENTO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM (
        'DINHEIRO',
        'PIX',
        'CARTAO_DEBITO',
        'CARTAO_CREDITO',
        'A_PRAZO',
        'ISENTO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. ITEM CATALOG: CATEGORIES, BRANDS, MODELS & VARIANTS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for system presets
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Layers',
    identifier_label VARCHAR(50) DEFAULT 'Nº de Série / IMEI',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for system brands
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_attribute_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES item_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key VARCHAR(50) NOT NULL,
    data_type VARCHAR(30) NOT NULL DEFAULT 'text', -- 'text', 'integer', 'decimal', 'boolean', 'select', 'currency'
    unit VARCHAR(20), -- 'g', 'ml', 'GB', 'V', 'W'
    options JSONB, -- Array of string options if select
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_filterable BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES item_categories(id) ON DELETE RESTRICT,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    internal_code VARCHAR(50),
    description TEXT,
    technical_notes TEXT,
    attributes JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES item_models(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "Preto Normal", "Preto XL", "128GB Azul"
    sku VARCHAR(50),
    attributes JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. CUSTOMER ASSETS (RECURRING EQUIPMENT HISTORY)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES item_models(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES item_variants(id) ON DELETE SET NULL,
    serial_number VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    attributes JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_assets_lookup ON customer_assets(tenant_id, customer_id, serial_number);

-- ----------------------------------------------------------------------------
-- 4. SERVICES, PRICING & RESULT DEFINITIONS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    default_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    estimated_time_minutes INT DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES item_categories(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, service_id, category_id)
);

CREATE TABLE IF NOT EXISTS service_price_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    category_id UUID REFERENCES item_categories(id) ON DELETE CASCADE,
    model_id UUID REFERENCES item_models(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES item_variants(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    promotional_price NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_field_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    category_id UUID REFERENCES item_categories(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    field_key VARCHAR(50) NOT NULL,
    field_type VARCHAR(30) NOT NULL DEFAULT 'text', -- 'decimal', 'text', 'checkbox', 'select'
    unit VARCHAR(20), -- 'g', 'ml', 'V'
    options JSONB,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS service_result_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES item_categories(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(30) DEFAULT 'emerald',
    is_approval BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ----------------------------------------------------------------------------
-- 5. WORKFLOW ENGINE & CHECKLISTS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES item_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(30) NOT NULL DEFAULT 'slate',
    stage_type VARCHAR(30) NOT NULL DEFAULT 'EM_ANDAMENTO', -- 'RECEBIDO', 'EM_ANDAMENTO', 'CONCLUIDO'
    sort_order INT NOT NULL DEFAULT 0,
    is_initial BOOLEAN NOT NULL DEFAULT FALSE,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES item_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_template_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- 6. ATOMIC SEQUENCE GENERATOR & SERVICE ORDERS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL DEFAULT 'SERVICE_ORDER',
    year INT NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    UNIQUE(tenant_id, doc_type, year)
);

CREATE OR REPLACE FUNCTION generate_next_service_order_number(p_tenant_id UUID)
RETURNS TABLE (
    out_order_number VARCHAR(30),
    out_sequence INT,
    out_year INT
) AS $$
DECLARE
    current_yr INT;
    next_seq INT;
BEGIN
    current_yr := EXTRACT(YEAR FROM NOW());
    
    INSERT INTO document_sequences (tenant_id, doc_type, year, last_sequence)
    VALUES (p_tenant_id, 'SERVICE_ORDER', current_yr, 1)
    ON CONFLICT (tenant_id, doc_type, year)
    DO UPDATE SET last_sequence = document_sequences.last_sequence + 1
    RETURNING document_sequences.last_sequence INTO next_seq;
    
    out_year := current_yr;
    out_sequence := next_seq;
    out_order_number := current_yr || '-' || LPAD(next_seq::TEXT, 6, '0');
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_number VARCHAR(30) NOT NULL,
    order_sequence INT NOT NULL,
    order_year INT NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    opened_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    status order_status NOT NULL DEFAULT 'ABERTA',
    financial_status financial_status NOT NULL DEFAULT 'PENDENTE',
    
    subtotal_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    surcharge_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    
    tracking_token VARCHAR(64) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    notes TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, order_year, order_sequence)
);

CREATE TABLE IF NOT EXISTS service_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    customer_asset_id UUID REFERENCES customer_assets(id) ON DELETE SET NULL,
    model_id UUID NOT NULL REFERENCES item_models(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES item_variants(id) ON DELETE SET NULL,
    item_index INT NOT NULL DEFAULT 1,
    internal_identifier VARCHAR(100) NOT NULL, -- Serial / IMEI / Final de Série
    reported_issue TEXT,
    reception_notes TEXT,
    technical_notes TEXT,
    accessories TEXT,
    checklist JSONB DEFAULT '[]'::jsonb,
    custom_field_values JSONB DEFAULT '{}'::jsonb,
    
    current_state_id UUID REFERENCES workflow_states(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RECEBIDO',
    result_id UUID REFERENCES service_result_definitions(id) ON DELETE SET NULL,
    assigned_technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    subtotal_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_order_item_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_order_item_id UUID NOT NULL REFERENCES service_order_items(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    quantity NUMERIC(6,2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    surcharge_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    field_data JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_method payment_method_type NOT NULL DEFAULT 'DINHEIRO',
    received_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES service_order_items(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_attribute_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_result_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_item_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY item_categories_isolation ON item_categories
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_system = TRUE OR is_super_admin());

CREATE POLICY brands_isolation ON brands
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_system = TRUE OR is_super_admin());

CREATE POLICY item_models_isolation ON item_models
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY customer_assets_isolation ON customer_assets
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY services_isolation ON services
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY service_orders_isolation ON service_orders
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY service_order_items_isolation ON service_order_items
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY payments_isolation ON payments
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());
