
CREATE TABLE public.medical_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  aliases text[] DEFAULT '{}',
  specialty text,
  definition_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(term)
);

ALTER TABLE public.medical_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read terms"
ON public.medical_terms FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage terms"
ON public.medical_terms FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
