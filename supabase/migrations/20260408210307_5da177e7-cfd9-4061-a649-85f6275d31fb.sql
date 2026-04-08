
-- Add new classification columns to medical_image_assets
ALTER TABLE public.medical_image_assets 
  ADD COLUMN IF NOT EXISTS validation_level TEXT DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS multimodal_ready BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS visual_coherence_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diagnostic_confidence_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS curation_notes TEXT;

-- Create curation log table
CREATE TABLE IF NOT EXISTS public.image_curation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.medical_image_assets(id) ON DELETE SET NULL,
  asset_code TEXT,
  image_type TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  search_queries JSONB DEFAULT '[]',
  selected_source JSONB,
  download_status TEXT DEFAULT 'pending',
  storage_path TEXT,
  thumbnail_path TEXT,
  classification JSONB,
  issues JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.image_curation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view curation logs"
  ON public.image_curation_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert curation logs"
  ON public.image_curation_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for fast multimodal readiness checks
CREATE INDEX IF NOT EXISTS idx_mia_multimodal_ready 
  ON public.medical_image_assets (multimodal_ready, image_type)
  WHERE multimodal_ready = true;
