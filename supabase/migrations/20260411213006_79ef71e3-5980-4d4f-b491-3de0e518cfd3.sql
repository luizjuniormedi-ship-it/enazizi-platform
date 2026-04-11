ALTER TABLE public.mnemonic_assets
  ADD COLUMN IF NOT EXISTS image_prompt_original text,
  ADD COLUMN IF NOT EXISTS image_prompt_refined text,
  ADD COLUMN IF NOT EXISTS visual_score integer,
  ADD COLUMN IF NOT EXISTS visual_audit_summary text,
  ADD COLUMN IF NOT EXISTS visual_regeneration_count integer DEFAULT 0;