
ALTER TABLE public.medical_image_assets
  ADD COLUMN IF NOT EXISTS asset_origin text NOT NULL DEFAULT 'ai_generated',
  ADD COLUMN IF NOT EXISTS clinical_confidence numeric(3,2) NOT NULL DEFAULT 0.60;

COMMENT ON COLUMN public.medical_image_assets.asset_origin IS 'Origem do asset: ai_generated, curated, real_exam, textbook';
COMMENT ON COLUMN public.medical_image_assets.clinical_confidence IS 'Confiança clínica do asset (0.00 a 1.00)';
