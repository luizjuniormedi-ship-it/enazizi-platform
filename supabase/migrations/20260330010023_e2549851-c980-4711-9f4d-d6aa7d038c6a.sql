
CREATE TABLE public.system_health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date date NOT NULL DEFAULT CURRENT_DATE,
  overall_status text NOT NULL DEFAULT 'ok',
  metrics_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  checks_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  critical_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  info_count integer NOT NULL DEFAULT 0,
  study_engine_ok boolean NOT NULL DEFAULT true,
  ai_ok boolean NOT NULL DEFAULT true,
  avg_ai_response_ms integer DEFAULT 0,
  active_users integer DEFAULT 0,
  total_checks integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read health logs"
  ON public.system_health_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages health logs"
  ON public.system_health_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_health_logs_run_date ON public.system_health_logs (run_date DESC);
