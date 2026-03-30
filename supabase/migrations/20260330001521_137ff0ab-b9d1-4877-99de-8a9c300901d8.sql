
-- Ranking snapshots: daily composite scores per user per ranking category
CREATE TABLE public.ranking_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  -- Composite scores (0-100)
  consistency_score numeric NOT NULL DEFAULT 0,
  evolution_score numeric NOT NULL DEFAULT 0,
  performance_score numeric NOT NULL DEFAULT 0,
  practical_score numeric NOT NULL DEFAULT 0,
  -- Ranks (computed)
  consistency_rank integer,
  evolution_rank integer,
  performance_rank integer,
  practical_rank integer,
  -- Deltas vs previous snapshot
  consistency_rank_delta integer DEFAULT 0,
  evolution_rank_delta integer DEFAULT 0,
  performance_rank_delta integer DEFAULT 0,
  practical_rank_delta integer DEFAULT 0,
  -- Percentile (0-100, top N%)
  percentile integer DEFAULT 50,
  -- Details
  details_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

ALTER TABLE public.ranking_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can read own snapshots
CREATE POLICY "Users can read own ranking snapshots"
  ON public.ranking_snapshots FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can read all for ranking display
CREATE POLICY "Authenticated can read all ranking snapshots for ranking"
  ON public.ranking_snapshots FOR SELECT TO authenticated
  USING (true);

-- Service role manages
CREATE POLICY "Service role manages ranking snapshots"
  ON public.ranking_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);
