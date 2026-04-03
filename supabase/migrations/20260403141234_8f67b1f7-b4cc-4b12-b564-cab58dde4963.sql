
CREATE TABLE public.practical_exam_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  specialty TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'intermediário',
  case_summary TEXT,
  scores_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  final_score NUMERIC NOT NULL DEFAULT 0,
  feedback_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  time_total_seconds INTEGER NOT NULL DEFAULT 0,
  steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.practical_exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own practical exam results"
  ON public.practical_exam_results FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own practical exam results"
  ON public.practical_exam_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all practical exam results"
  ON public.practical_exam_results FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_practical_exam_user ON public.practical_exam_results(user_id, created_at DESC);
