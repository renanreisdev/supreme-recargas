-- ============================================================================
-- SUPREME RECARGAS 2 - MIGRATION 0006: PERMISSION GROUPS RLS & SEARCH PATH FIXES
-- Enables Row Level Security on permission_groups and sets search_path on functions
-- ============================================================================

-- 1. Enable RLS on permission_groups
ALTER TABLE "public"."permission_groups" ENABLE ROW LEVEL SECURITY;

-- 2. Add policy for permission_groups
CREATE POLICY "Allow public access permission_groups" ON "public"."permission_groups"
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. Secure functions search_path
ALTER FUNCTION public.generate_next_entry_number(UUID) SET search_path = public;
ALTER FUNCTION public.calculate_cartridge_weight_diff() SET search_path = public;
