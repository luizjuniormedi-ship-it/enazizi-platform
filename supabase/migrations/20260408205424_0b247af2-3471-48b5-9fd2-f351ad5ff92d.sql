
-- Create safety log table
CREATE TABLE IF NOT EXISTS public.multimodal_safety_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.medical_image_assets(id) ON DELETE SET NULL,
  asset_code TEXT,
  block_reason TEXT NOT NULL,
  fallback_used BOOLEAN DEFAULT true,
  asset_origin TEXT,
  review_status TEXT,
  integrity_status TEXT,
  clinical_confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.multimodal_safety_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view safety logs"
  ON public.multimodal_safety_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Migrate existing asset_origin values
UPDATE public.medical_image_assets 
SET asset_origin = 'real_medical' 
WHERE asset_origin = 'real_clinical';

UPDATE public.medical_image_assets 
SET asset_origin = 'educational_ai' 
WHERE asset_origin = 'pending_real';

-- Add index for fast safety checks
CREATE INDEX IF NOT EXISTS idx_mia_safety_check 
  ON public.medical_image_assets (asset_origin, review_status, integrity_status, clinical_confidence, is_active)
  WHERE image_url IS NOT NULL;
