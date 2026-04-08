
-- Batch tracking table
CREATE TABLE public.multimodal_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_code TEXT NOT NULL UNIQUE,
  total_questions INTEGER NOT NULL DEFAULT 0,
  total_auto_corrected INTEGER NOT NULL DEFAULT 0,
  avg_editorial_score NUMERIC(5,2) DEFAULT 0,
  modalities_covered TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  consolidated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.multimodal_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read batches" ON public.multimodal_batches FOR SELECT USING (true);
CREATE POLICY "Service role manages batches" ON public.multimodal_batches FOR ALL USING (true) WITH CHECK (true);

-- Editorial audit trail
CREATE TABLE public.editorial_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES public.multimodal_batches(id),
  question_id UUID NOT NULL,
  correction_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  version_before JSONB,
  version_after JSONB,
  editorial_score NUMERIC(5,2),
  corrected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.editorial_audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read audit trail" ON public.editorial_audit_trail FOR SELECT USING (true);
CREATE POLICY "Service role manages audit" ON public.editorial_audit_trail FOR ALL USING (true) WITH CHECK (true);

-- Add batch reference to questions
ALTER TABLE public.medical_image_questions ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.multimodal_batches(id);
ALTER TABLE public.medical_image_questions ADD COLUMN IF NOT EXISTS is_batch_protected BOOLEAN DEFAULT false;
ALTER TABLE public.medical_image_questions ADD COLUMN IF NOT EXISTS editorial_score NUMERIC(5,2);

-- Timestamps trigger
CREATE TRIGGER update_multimodal_batches_updated_at
  BEFORE UPDATE ON public.multimodal_batches
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
