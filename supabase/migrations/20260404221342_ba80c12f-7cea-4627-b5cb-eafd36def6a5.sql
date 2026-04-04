-- Add quality_tier column
ALTER TABLE public.questions_bank 
ADD COLUMN IF NOT EXISTS quality_tier text NOT NULL DEFAULT 'basic';

-- Classify existing questions by statement length
UPDATE public.questions_bank
SET quality_tier = CASE
  WHEN length(statement) >= 400 THEN 'exam_standard'
  WHEN length(statement) >= 200 THEN 'basic'
  ELSE 'needs_upgrade'
END;

-- Move very short approved questions back to needs_upgrade review status
UPDATE public.questions_bank
SET review_status = 'needs_upgrade'
WHERE review_status = 'approved' AND length(statement) < 200;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_questions_bank_quality_tier ON public.questions_bank(quality_tier);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_questions_bank_approved_quality ON public.questions_bank(review_status, quality_tier) WHERE review_status = 'approved';