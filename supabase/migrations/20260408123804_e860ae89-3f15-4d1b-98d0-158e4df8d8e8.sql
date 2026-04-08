ALTER TABLE public.medical_image_assets
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS license_type TEXT NOT NULL DEFAULT 'ai_generated',
  ADD COLUMN IF NOT EXISTS source_domain TEXT;