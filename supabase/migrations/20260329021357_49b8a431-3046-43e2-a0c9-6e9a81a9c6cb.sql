
CREATE TABLE public.approval_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  accuracy numeric NOT NULL DEFAULT 0,
  domain_score numeric NOT NULL DEFAULT 0,
  review_score numeric NOT NULL DEFAULT 0,
  consistency_score numeric NOT NULL DEFAULT 0,
  simulation_score numeric NOT NULL DEFAULT 0,
  error_penalty numeric NOT NULL DEFAULT 0,
  details_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own approval scores"
  ON public.approval_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own approval scores"
  ON public.approval_scores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all"
  ON public.approval_scores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_approval_scores_user_date ON public.approval_scores (user_id, created_at DESC);
