-- ============================================================================
-- MIGRATION 0013: MIGRATE DEFAULT DOMAIN, EMAIL AND PIX TO SUPREMEAPPS.COM.BR
-- Atualiza support_email e pix_key padrao da tabela platform_settings para
-- @supremeapps.com.br, preservando valores customizados diferentes do antigo.
-- ============================================================================

ALTER TABLE platform_settings
  ALTER COLUMN support_email SET DEFAULT 'suporte@supremeapps.com.br',
  ALTER COLUMN pix_key SET DEFAULT 'pix@supremeapps.com.br';

UPDATE platform_settings
SET
  support_email = CASE WHEN support_email = 'suporte@supremeinformatica.com.br' THEN 'suporte@supremeapps.com.br' ELSE support_email END,
  pix_key = CASE WHEN pix_key = 'pix@supremeinformatica.com.br' THEN 'pix@supremeapps.com.br' ELSE pix_key END,
  updated_at = NOW()
WHERE id = 'global';
