-- ============================================================================
-- MIGRATION 0011: RECEIPT PER-COPY INDIVIDUAL CONFIGURATION (1ª VIA & 2ª VIA)
-- Permite configurar individualmente todas as seções exibidas na 1ª e 2ª via
-- dos recibos térmicos de entrada e entrega.
-- ============================================================================

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS receipt_copy_1_config JSONB,
  ADD COLUMN IF NOT EXISTS receipt_copy_2_config JSONB;
