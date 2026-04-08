-- Add editorial audit columns
ALTER TABLE public.medical_image_questions 
ADD COLUMN IF NOT EXISTS senior_audit_score integer,
ADD COLUMN IF NOT EXISTS editorial_grade text;

-- Add comment for documentation
COMMENT ON COLUMN public.medical_image_questions.senior_audit_score IS 'Score 0-100 from senior medical audit';
COMMENT ON COLUMN public.medical_image_questions.editorial_grade IS 'excellent (>=90), good (75-89), weak (<75)';

-- Add index for filtering by grade
CREATE INDEX IF NOT EXISTS idx_miq_editorial_grade ON public.medical_image_questions(editorial_grade) WHERE editorial_grade IS NOT NULL;