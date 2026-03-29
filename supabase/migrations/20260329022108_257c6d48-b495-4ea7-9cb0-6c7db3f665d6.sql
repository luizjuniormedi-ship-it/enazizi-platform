
CREATE TABLE public.diagnostic_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cycle text NOT NULL DEFAULT 'clinico',
  score numeric NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  areas_evaluated jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostic_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own diagnostic sessions"
  ON public.diagnostic_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own diagnostic sessions"
  ON public.diagnostic_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_diagnostic_sessions_user ON public.diagnostic_sessions (user_id, created_at DESC);

CREATE TABLE public.diagnostic_topic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  topic text NOT NULL,
  correct integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  accuracy numeric NOT NULL DEFAULT 0,
  avg_time_seconds numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostic_topic_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own diagnostic topic results"
  ON public.diagnostic_topic_results FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own diagnostic topic results"
  ON public.diagnostic_topic_results FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_diagnostic_topic_results_session ON public.diagnostic_topic_results (session_id);
CREATE INDEX idx_diagnostic_topic_results_user ON public.diagnostic_topic_results (user_id, created_at DESC);
