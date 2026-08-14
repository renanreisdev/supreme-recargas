-- ============================================================================
-- SUPREME RECARGAS 2 - MIGRATION 0002: ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenant Data Isolation & RBAC Security Layer
-- ============================================================================

-- Enable RLS on all Tenant-Specific Tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartridge_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartridge_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartridge_model_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartridge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartridge_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Helper Function to get current user tenant_id
CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper Function to check if user is SUPER_ADMIN
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT role = 'SUPER_ADMIN' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. COMPANIES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY companies_tenant_select ON companies
    FOR SELECT USING (id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY companies_super_admin_all ON companies
    FOR ALL USING (is_super_admin());

-- ----------------------------------------------------------------------------
-- 2. PROFILES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY profiles_tenant_select ON profiles
    FOR SELECT USING (tenant_id = current_user_tenant_id() OR is_super_admin() OR id = auth.uid());

CREATE POLICY profiles_admin_insert_update ON profiles
    FOR ALL USING (
        (tenant_id = current_user_tenant_id() AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'ADMINISTRADOR'))
        OR is_super_admin()
    );

-- ----------------------------------------------------------------------------
-- 3. CUSTOMERS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY customers_tenant_isolation ON customers
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

-- ----------------------------------------------------------------------------
-- 4. CARTRIDGE BRANDS & MODELS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY cartridge_brands_tenant_isolation ON cartridge_brands
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY cartridge_models_tenant_isolation ON cartridge_models
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

-- ----------------------------------------------------------------------------
-- 5. SERVICE PRICES & MODEL PRICES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY service_prices_tenant_isolation ON service_prices
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY cartridge_model_prices_tenant_isolation ON cartridge_model_prices
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

-- ----------------------------------------------------------------------------
-- 6. CARTRIDGE ENTRIES & CARTRIDGES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY cartridge_entries_tenant_isolation ON cartridge_entries
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY cartridges_tenant_isolation ON cartridges
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

-- ----------------------------------------------------------------------------
-- 7. HISTORY, DELIVERIES & AUDIT LOGS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY status_history_tenant_isolation ON cartridge_status_history
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY deliveries_tenant_isolation ON deliveries
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());

CREATE POLICY company_settings_tenant_isolation ON company_settings
    FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin());
