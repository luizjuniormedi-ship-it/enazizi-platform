
-- Add question_mode and hard validation fields to medical_image_questions
ALTER TABLE public.medical_image_questions
  ADD COLUMN IF NOT EXISTS question_mode text DEFAULT 'multimodal',
  ADD COLUMN IF NOT EXISTS hard_validation_score integer,
  ADD COLUMN IF NOT EXISTS hard_validation_reasons text[];
