
CREATE TABLE public.system_health_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_date date NOT NULL DEFAULT CURRENT_DATE,
  alerts jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_critical integer NOT NULL DEFAULT 0,
  total_warning integer NOT NULL DEFAULT 0,
  total_info integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.system_health_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read health reports"
ON public.system_health_reports
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert health reports"
ON public.system_health_reports
FOR INSERT
TO service_role
WITH CHECK (true);
