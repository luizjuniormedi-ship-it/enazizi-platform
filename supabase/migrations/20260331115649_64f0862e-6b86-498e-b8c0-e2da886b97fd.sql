
-- 1. Create ingestion_log table
CREATE TABLE public.ingestion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_url text,
  source_type text NOT NULL DEFAULT 'unknown',
  permission_type text NOT NULL DEFAULT 'unknown',
  banca text,
  year integer,
  questions_found integer NOT NULL DEFAULT 0,
  questions_inserted integer NOT NULL DEFAULT 0,
  questions_updated integer NOT NULL DEFAULT 0,
  duplicates_skipped integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.ingestion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ingestion log"
  ON public.ingestion_log FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages ingestion log"
  ON public.ingestion_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Add source_type, permission_type, source_url to questions_bank
ALTER TABLE public.questions_bank
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS permission_type text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS source_url text;
