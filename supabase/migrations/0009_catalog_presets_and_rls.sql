-- ============================================================================
-- MIGRATION 0009: CATALOG PRESETS ONBOARDING & EXTRA CATALOG COLUMNS
-- Garante colunas do Assistente de Pré-Cadastros em companies, colunas extras
-- utilizadas pelo catálogo em item_categories / item_models / services, e o
-- workflow_template padrão para persistência das etapas Kanban por loja.
-- (As políticas "Allow public access ..." já existem nestas tabelas.)
-- ============================================================================

-- 1. COMPANIES: Flags do Assistente de Pré-Cadastros
ALTER TABLE companies ADD COLUMN IF NOT EXISTS presets_configured_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS presets_dismissed_at TIMESTAMPTZ;

-- 2. ITEM_CATEGORIES: Campos flexíveis por categoria
ALTER TABLE item_categories ADD COLUMN IF NOT EXISTS inspection_type TEXT DEFAULT 'STANDARD';
ALTER TABLE item_categories ADD COLUMN IF NOT EXISTS inspection_type_label TEXT;
ALTER TABLE item_categories ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE item_categories ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;
ALTER TABLE item_categories ADD COLUMN IF NOT EXISTS technical_verdicts JSONB DEFAULT '[]'::jsonb;

-- 3. ITEM_MODELS: Marca textual, tabela de preços por serviço e pesos opcionais
ALTER TABLE item_models ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE item_models ADD COLUMN IF NOT EXISTS service_prices JSONB DEFAULT '{}'::jsonb;
ALTER TABLE item_models ADD COLUMN IF NOT EXISTS empty_weight_grams NUMERIC(8, 2);
ALTER TABLE item_models ADD COLUMN IF NOT EXISTS full_weight_grams NUMERIC(8, 2);

-- 4. SERVICES: Categorias compatíveis em array JSON
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_ids JSONB DEFAULT '[]'::jsonb;

-- 5. WORKFLOW_TEMPLATES: Template global padrão referenciado por workflow_states
INSERT INTO workflow_templates (id, tenant_id, name, description, is_default)
VALUES (
  'a3000000-0000-0000-0000-000000000001',
  NULL,
  'Fluxo Kanban Padrão Agil OS',
  'Template raiz utilizado para vincular as etapas Kanban personalizadas de cada empresa.',
  TRUE
)
ON CONFLICT (id) DO NOTHING;
