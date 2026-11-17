-- ============================================================================
-- MIGRATION 0012: UNIVERSAL CASH REGISTER SETTINGS & MULTI-OPERATOR INDEXES
-- Permite configurar o modo de caixa (SHARED = Único Compartilhado vs
-- PER_OPERATOR = Por Operador) e a política de lançamento no financeiro
-- (AUTO_OPEN, REQUIRE_OPEN, OPTIONAL), além do fundo de troco padrão.
-- ============================================================================

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS cash_register_mode TEXT NOT NULL DEFAULT 'SHARED',
  ADD COLUMN IF NOT EXISTS cash_register_policy TEXT NOT NULL DEFAULT 'AUTO_OPEN',
  ADD COLUMN IF NOT EXISTS default_cash_register_float NUMERIC(10, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_cash_registers_tenant_opener
  ON cash_registers(tenant_id, opened_by, status);

CREATE INDEX IF NOT EXISTS idx_cash_movements_performer
  ON cash_register_movements(tenant_id, performed_by);
