
DROP INDEX IF EXISTS idx_qa_runs_created;
DROP INDEX IF EXISTS idx_qa_runs_status;

CREATE TABLE IF NOT EXISTS public.qa_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL DEFAULT 'manual',
  level int NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms int,
  modules_checked jsonb DEFAULT '[]'::jsonb,
  total_findings int DEFAULT 0,
  total_corrected int DEFAULT 0,
  total_partial int DEFAULT 0,
  total_escalated int DEFAULT 0,
  total_detected int DEFAULT 0,
  auto_fix_rate_pct int DEFAULT 0,
  summary_report jsonb DEFAULT '{}'::jsonb,
  previous_comparison jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qa_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view qa_runs"
  ON public.qa_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages qa_runs"
  ON public.qa_runs FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX idx_qa_bot_runs_created ON public.qa_runs(created_at DESC);
CREATE INDEX idx_qa_bot_runs_status ON public.qa_runs(status);
