-- ============================================================================
-- MIGRATION 0010: SERVICE COURTESY & TECHNICAL PHOTO QUALITY REVIEW
-- Adiciona suporte nativo para cortesia habilitável por serviço e rastreamento
-- de aceite de qualidade por foto pelo cliente na página de acompanhamento.
-- ============================================================================

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS allow_courtesy BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE service_order_item_services
  ADD COLUMN IF NOT EXISTS is_courtesy BOOLEAN NOT NULL DEFAULT FALSE;
