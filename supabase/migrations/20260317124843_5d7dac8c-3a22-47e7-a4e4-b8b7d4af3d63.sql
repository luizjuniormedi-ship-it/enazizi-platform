CREATE TABLE public.clinical_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  specialty text NOT NULL,
  title text NOT NULL,
  clinical_history text NOT NULL,
  vitals jsonb DEFAULT '{}'::jsonb,
  physical_exam text,
  lab_results jsonb DEFAULT '[]'::jsonb,
  imaging text,
  correct_diagnosis text NOT NULL,
  differential_diagnoses jsonb DEFAULT '[]'::jsonb,
  treatment text,
  explanation text,
  difficulty integer DEFAULT 3,
  source text,
  is_global boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read clinical cases"
  ON public.clinical_cases FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can CRUD own clinical cases"
  ON public.clinical_cases FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());