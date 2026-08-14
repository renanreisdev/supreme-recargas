-- ============================================================================
-- SUPREME RECARGAS 2 - MIGRATION 0001: INITIAL SCHEMA
-- System: Multi-Tenant Cartridge Refill Management SaaS
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'ADMINISTRADOR',
    'ATENDENTE',
    'TECNICO'
);

CREATE TYPE subscription_status AS ENUM (
    'ACTIVE',
    'TRIAL',
    'PAUSED',
    'EXPIRED',
    'CANCELLED'
);

CREATE TYPE requested_service AS ENUM (
    'VERIFICACAO',
    'RECARGA',
    'VERIFICACAO_E_RECARGA',
    'TESTE',
    'OUTRO'
);

CREATE TYPE cartridge_status AS ENUM (
    'RECEBIDO',
    'AGUARDANDO_VERIFICACAO',
    'EM_VERIFICACAO',
    'AGUARDANDO_RECARGA',
    'EM_RECARGA',
    'AGUARDANDO_TESTE',
    'EM_TESTE',
    'FINALIZADO',
    'ENTREGUE',
    'COM_PROBLEMA',
    'SEM_REPARO',
    'CANCELADO'
);

CREATE TYPE result_classification AS ENUM (
    'PENDENTE',
    'OK',
    'CID',
    'QUEIMADO',
    'FALHA_IMPRESSAO',
    'ENTUPIDO',
    'SEM_REPARO',
    'OUTRO'
);

-- ----------------------------------------------------------------------------
-- 1. PLANS & SUBSCRIPTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    max_administrators INT NOT NULL DEFAULT 1,
    max_attendants INT NOT NULL DEFAULT 3,
    max_technicians INT NOT NULL DEFAULT 1,
    monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corporate_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status subscription_status NOT NULL DEFAULT 'TRIAL',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    custom_max_administrators INT,
    custom_max_attendants INT,
    custom_max_technicians INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. USERS & PROFILES (RBAC + MULTI-TENANCY)
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
    tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'ATENDENTE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. CUSTOMERS
-- ----------------------------------------------------------------------------
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    internal_code SERIAL,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20), -- CPF or CNPJ
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    company_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_customers_tenant_phone ON customers(tenant_id, phone);
CREATE INDEX idx_customers_tenant_name ON customers(tenant_id, name);

-- ----------------------------------------------------------------------------
-- 4. CARTRIDGE MODELS & PRICING
-- ----------------------------------------------------------------------------
CREATE TABLE cartridge_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cartridge_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES cartridge_brands(id) ON DELETE SET NULL,
    model_name VARCHAR(100) NOT NULL, -- e.g., HP 664, Canon CL-146
    color VARCHAR(50) NOT NULL DEFAULT 'Preto', -- 'Preto' or 'Colorido'
    is_xl BOOLEAN NOT NULL DEFAULT FALSE,
    capacity_ml NUMERIC(6,2),
    empty_weight_grams NUMERIC(6,2),
    full_weight_grams NUMERIC(6,2),
    technical_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_type requested_service NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    default_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cartridge_model_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES cartridge_models(id) ON DELETE CASCADE,
    service_type requested_service NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    promotional_price NUMERIC(10,2),
    promo_start_date TIMESTAMPTZ,
    promo_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, model_id, service_type)
);

-- ----------------------------------------------------------------------------
-- 5. CARTRIDGE ENTRIES & INDIVIDUAL CARTRIDGES
-- ----------------------------------------------------------------------------
CREATE TABLE cartridge_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_number VARCHAR(30) NOT NULL, -- Format: 2026-000001
    entry_sequence INT NOT NULL,
    entry_year INT NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    attendant_id UUID NOT NULL REFERENCES profiles(id),
    entry_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subtotal_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    surcharge_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    general_notes TEXT,
    tracking_token VARCHAR(64) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES profiles(id),
    UNIQUE(tenant_id, entry_year, entry_sequence)
);

CREATE TABLE cartridges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES cartridge_entries(id) ON DELETE CASCADE,
    serial_number VARCHAR(40) NOT NULL, -- Format: 2026-000001-01
    item_index INT NOT NULL DEFAULT 1,
    model_id UUID NOT NULL REFERENCES cartridge_models(id),
    service_requested requested_service NOT NULL DEFAULT 'RECARGA',
    color VARCHAR(50) NOT NULL DEFAULT 'Preto',
    is_xl BOOLEAN NOT NULL DEFAULT FALSE,
    final_serie VARCHAR(50) NOT NULL, -- Identifying serial end/code
    status cartridge_status NOT NULL DEFAULT 'RECEBIDO',
    result_classification result_classification NOT NULL DEFAULT 'PENDENTE',
    result_other_description TEXT,
    
    -- Technical assignment & weights
    technician_id UUID REFERENCES profiles(id),
    input_weight_grams NUMERIC(6,2),
    output_weight_grams NUMERIC(6,2),
    weight_diff_grams NUMERIC(6,2),
    reception_notes TEXT,
    technical_notes TEXT,
    
    -- Snapshotted Price
    original_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    applied_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    surcharge_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    final_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    price_override_reason TEXT,
    price_modified_by UUID REFERENCES profiles(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES profiles(id),
    UNIQUE(tenant_id, serial_number)
);

CREATE INDEX idx_cartridges_tenant_status ON cartridges(tenant_id, status);
CREATE INDEX idx_cartridges_tenant_final_serie ON cartridges(tenant_id, final_serie);

-- ----------------------------------------------------------------------------
-- 6. HISTORY, DELIVERIES & AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE cartridge_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    cartridge_id UUID NOT NULL REFERENCES cartridges(id) ON DELETE CASCADE,
    previous_status cartridge_status,
    new_status cartridge_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES cartridge_entries(id) ON DELETE CASCADE,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_by UUID NOT NULL REFERENCES profiles(id),
    receiver_name VARCHAR(255) NOT NULL,
    receiver_document VARCHAR(30),
    notes TEXT,
    signature_data_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'CREATE_ENTRY', 'UPDATE_PRICE', 'CHANGE_STATUS'
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. COMPANY SETTINGS & PRINTER PREFERENCES
-- ----------------------------------------------------------------------------
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    show_prices_on_receipt BOOLEAN NOT NULL DEFAULT TRUE,
    receipt_header_note TEXT,
    receipt_footer_note TEXT,
    verification_waiver_policy VARCHAR(50) NOT NULL DEFAULT 'CREDIT_IF_REFILLED', -- 'ALWAYS_CHARGE', 'WAIVE_IF_REFILLED', 'CREDIT_IF_REFILLED'
    thermal_paper_width_mm INT NOT NULL DEFAULT 80, -- 58 or 80
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
