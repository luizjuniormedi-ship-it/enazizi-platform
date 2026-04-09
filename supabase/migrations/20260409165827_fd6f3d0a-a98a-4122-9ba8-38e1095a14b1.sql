CREATE TABLE public.pipeline_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  message text NOT NULL,
  details jsonb,
  acknowledged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pipeline_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read pipeline alerts"
  ON public.pipeline_alerts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert pipeline alerts"
  ON public.pipeline_alerts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_pipeline_alerts_created ON public.pipeline_alerts(created_at DESC);
CREATE INDEX idx_pipeline_alerts_type ON public.pipeline_alerts(alert_type);