-- ============================================================================
-- SUPREME RECARGAS 2 - MIGRATION 0003: FUNCTIONS & TRIGGERS
-- Atomic Entry Numbering Generator & Audit Triggers
-- ============================================================================

-- Function to generate sequential entry numbers atomically per tenant per year
CREATE OR REPLACE FUNCTION generate_next_entry_number(p_tenant_id UUID)
RETURNS TABLE (
    out_entry_number VARCHAR(30),
    out_sequence INT,
    out_year INT
) AS $$
DECLARE
    current_yr INT;
    next_seq INT;
BEGIN
    current_yr := EXTRACT(YEAR FROM NOW());
    
    -- Lock row or insert if new year
    SELECT COALESCE(MAX(entry_sequence), 0) + 1 INTO next_seq
    FROM cartridge_entries
    WHERE tenant_id = p_tenant_id AND entry_year = current_yr
    FOR UPDATE;
    
    out_year := current_yr;
    out_sequence := next_seq;
    out_entry_number := current_yr || '-' || LPAD(next_seq::TEXT, 6, '0');
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate weight difference on cartridge update
CREATE OR REPLACE FUNCTION calculate_cartridge_weight_diff()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.input_weight_grams IS NOT NULL AND NEW.output_weight_grams IS NOT NULL THEN
        NEW.weight_diff_grams := NEW.output_weight_grams - NEW.input_weight_grams;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cartridge_weight_diff
    BEFORE INSERT OR UPDATE ON cartridges
    FOR EACH ROW
    EXECUTE FUNCTION calculate_cartridge_weight_diff();

-- Function to audit status transitions automatically
CREATE OR REPLACE FUNCTION audit_cartridge_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO cartridge_status_history (
            tenant_id,
            cartridge_id,
            previous_status,
            new_status,
            changed_by,
            notes
        ) VALUES (
            NEW.tenant_id,
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(auth.uid(), NEW.technician_id),
            'Transição de status automatizada'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_cartridge_status
    AFTER UPDATE ON cartridges
    FOR EACH ROW
    EXECUTE FUNCTION audit_cartridge_status_change();
