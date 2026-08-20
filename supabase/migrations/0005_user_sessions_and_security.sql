-- ============================================================================
-- SUPREME RECARGAS 2 - MIGRATION 0005: SINGLE ACTIVE SESSION & SECURITY TIMEOUTS
-- Adds device tracking, single active session enforcement & auto-logout rules
-- ============================================================================

-- 1. PROFILES: Session & Inactivity Fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS active_session_token TEXT,
ADD COLUMN IF NOT EXISTS active_session_device TEXT,
ADD COLUMN IF NOT EXISTS active_session_ip TEXT,
ADD COLUMN IF NOT EXISTS active_session_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS inactivity_timeout_minutes INT DEFAULT 0;

-- 2. PERMISSION_GROUPS: Default Inactivity Timeout per Group
ALTER TABLE permission_groups
ADD COLUMN IF NOT EXISTS default_inactivity_timeout_minutes INT DEFAULT 0;

-- 3. COMPANY_SETTINGS: Default Company Inactivity Timeout Policy
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS default_inactivity_timeout_minutes INT DEFAULT 0;

-- 4. COMMENTS FOR SCHEMA DOCUMENTATION
COMMENT ON COLUMN profiles.active_session_token IS 'Token único da sessão atualmente ativa do usuário. Invalida sessões anteriores em logins concorrentes.';
COMMENT ON COLUMN profiles.active_session_device IS 'Descrição do dispositivo e navegador que realizou o último login.';
COMMENT ON COLUMN profiles.active_session_at IS 'Data/hora de início da sessão ativa.';
COMMENT ON COLUMN profiles.inactivity_timeout_minutes IS 'Tempo limite de inatividade em minutos para desconexão automática (0 = desativado).';
