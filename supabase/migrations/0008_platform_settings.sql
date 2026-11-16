-- ============================================================================
-- MIGRATION 0008: GLOBAL SAAS PLATFORM SETTINGS & BILLING CONFIGURATION
-- Armazena chave Pix oficial, WhatsApp financeiro/suporte, regras de trial e
-- comunicados globais gerenciados pelo Super Admin.
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  platform_name TEXT NOT NULL DEFAULT 'Agil OS',
  support_whatsapp TEXT NOT NULL DEFAULT '5511999999999',
  support_email TEXT NOT NULL DEFAULT 'suporte@supremeinformatica.com.br',
  pix_key TEXT NOT NULL DEFAULT 'pix@supremeinformatica.com.br',
  pix_beneficiary TEXT NOT NULL DEFAULT 'SUPREME INFORMATICA SISTEMAS',
  pix_city TEXT NOT NULL DEFAULT 'SAO PAULO',
  default_trial_days INTEGER NOT NULL DEFAULT 14,
  annual_discount_percent INTEGER NOT NULL DEFAULT 20,
  global_announcement TEXT NOT NULL DEFAULT '',
  global_announcement_type TEXT NOT NULL DEFAULT 'info',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access platform_settings" ON platform_settings;
CREATE POLICY "Allow public access platform_settings"
  ON platform_settings FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO platform_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;
