
CREATE TABLE public.discursive_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  specialty text NOT NULL,
  question_text text NOT NULL,
  student_answer text,
  ai_correction jsonb DEFAULT '{}'::jsonb,
  score numeric DEFAULT 0,
  max_score numeric DEFAULT 10,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE public.discursive_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own discursive attempts"
  ON public.discursive_attempts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all discursive attempts"
  ON public.discursive_attempts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
