-- ============================================================================
-- MIGRATION 0014: SYNC RESILIENCE, ATOMIC OS SEQUENCE & LAN HUB SETTINGS
-- 1) Adiciona configurações de Modo de Operação (Nível 1 Nuvem vs Nível 2 Hub LAN)
-- 2) Blindagem atômica em generate_next_service_order_number para evitar
--    colisão quando múltiplos terminais offline voltam à nuvem.
-- ============================================================================

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS sync_operation_mode TEXT NOT NULL DEFAULT 'CLOUD_ONLY',
  ADD COLUMN IF NOT EXISTS lan_hub_url TEXT,
  ADD COLUMN IF NOT EXISTS lan_hub_token TEXT,
  ADD COLUMN IF NOT EXISTS lan_hub_port INTEGER NOT NULL DEFAULT 4321,
  ADD COLUMN IF NOT EXISTS lan_hub_auto_fallback BOOLEAN NOT NULL DEFAULT TRUE;

CREATE OR REPLACE FUNCTION generate_next_service_order_number(p_tenant_id UUID)
RETURNS TABLE (
    out_order_number VARCHAR(30),
    out_sequence INT,
    out_year INT
) AS $$
DECLARE
    current_yr INT;
    max_existing INT;
    next_seq INT;
BEGIN
    current_yr := EXTRACT(YEAR FROM NOW());

    -- Lock transacional por empresa+ano para evitar condição de corrida
    PERFORM pg_advisory_xact_lock(hashtext(p_tenant_id::text || '-' || current_yr::text));

    SELECT COALESCE(MAX(order_sequence), 0)
    INTO max_existing
    FROM service_orders
    WHERE tenant_id = p_tenant_id
      AND order_year = current_yr;

    INSERT INTO document_sequences (tenant_id, doc_type, year, last_sequence)
    VALUES (p_tenant_id, 'SERVICE_ORDER', current_yr, max_existing + 1)
    ON CONFLICT (tenant_id, doc_type, year)
    DO UPDATE SET last_sequence = GREATEST(document_sequences.last_sequence, max_existing) + 1
    RETURNING document_sequences.last_sequence INTO next_seq;

    out_year := current_yr;
    out_sequence := next_seq;
    out_order_number := current_yr || '-' || LPAD(next_seq::TEXT, 6, '0');

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_next_service_order_number(UUID) TO anon, authenticated;
