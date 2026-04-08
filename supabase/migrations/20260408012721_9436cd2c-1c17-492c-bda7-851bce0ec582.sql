
-- Campos de rastreabilidade
ALTER TABLE medical_image_assets 
  ADD COLUMN IF NOT EXISTS clinical_validation_notes text,
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS integrity_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS duplicate_group_key text;

-- Função RPC para painel de integridade
CREATE OR REPLACE FUNCTION public.get_image_integrity_summary()
RETURNS TABLE(
  image_type text,
  review_status text,
  total bigint,
  unique_images bigint,
  avg_confidence numeric,
  is_active boolean,
  integrity_issues bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.image_type::text,
    a.review_status::text,
    COUNT(*) as total,
    COUNT(DISTINCT a.image_url) as unique_images,
    ROUND(AVG(a.clinical_confidence), 2) as avg_confidence,
    a.is_active,
    COUNT(*) FILTER (WHERE a.integrity_status IN ('mismatch_type','mismatch_diagnosis','generic_image','duplicate_unresolved')) as integrity_issues
  FROM medical_image_assets a
  GROUP BY a.image_type, a.review_status, a.is_active
  ORDER BY a.image_type, a.review_status;
$$;
