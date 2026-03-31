
ALTER TABLE public.questions_bank 
ADD COLUMN IF NOT EXISTS exam_bank_id uuid REFERENCES public.exam_banks(id),
ADD COLUMN IF NOT EXISTS question_order integer;

CREATE INDEX IF NOT EXISTS idx_questions_bank_exam_bank_id ON public.questions_bank(exam_bank_id);
