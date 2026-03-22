CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

CREATE TABLE IF NOT EXISTS public.daily_generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date date NOT NULL DEFAULT CURRENT_DATE,
  specialties_processed jsonb NOT NULL DEFAULT '{}'::jsonb,
  questions_generated integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read generation log"
  ON public.daily_generation_log
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert generation log"
  ON public.daily_generation_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);