
-- System metrics for monitoring dashboard
CREATE TABLE public.system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast time-range queries
CREATE INDEX idx_system_metrics_type_time ON public.system_metrics (metric_type, recorded_at DESC);

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system metrics"
ON public.system_metrics FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage system metrics"
ON public.system_metrics FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- AI usage logs
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  model_used text,
  tokens_used integer DEFAULT 0,
  response_time_ms integer DEFAULT 0,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_logs_time ON public.ai_usage_logs (created_at DESC);
CREATE INDEX idx_ai_usage_logs_function ON public.ai_usage_logs (function_name, created_at DESC);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all AI usage logs"
ON public.ai_usage_logs FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage AI usage logs"
ON public.ai_usage_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Users can insert own AI usage logs"
ON public.ai_usage_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
