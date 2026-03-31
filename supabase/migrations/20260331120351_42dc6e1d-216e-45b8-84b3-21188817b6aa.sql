
CREATE TABLE public.external_exam_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  exam_info text,
  specialty text,
  year integer,
  source_url text NOT NULL,
  source_type text NOT NULL DEFAULT 'indexed_only',
  permission_type text NOT NULL DEFAULT 'indexed_external',
  processing_status text NOT NULL DEFAULT 'pending',
  extracted_questions_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.external_exam_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage external exam sources"
  ON public.external_exam_sources FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages external exam sources"
  ON public.external_exam_sources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE UNIQUE INDEX idx_external_exam_sources_url ON public.external_exam_sources(source_url);
