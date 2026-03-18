
CREATE TABLE public.exam_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  banca text NOT NULL,
  year integer NOT NULL,
  specialty text,
  total_questions integer DEFAULT 0,
  time_limit_minutes integer DEFAULT 180,
  source_tag text NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exam_banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read exam banks"
ON public.exam_banks FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage exam banks"
ON public.exam_banks FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
