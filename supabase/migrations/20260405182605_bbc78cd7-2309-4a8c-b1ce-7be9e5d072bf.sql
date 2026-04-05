
-- 1. user_missions — persistent mission state
CREATE TABLE public.user_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_index INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  completion_sources JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active/paused mission per user
CREATE UNIQUE INDEX idx_user_missions_active ON public.user_missions (user_id)
  WHERE status IN ('active', 'paused');

CREATE INDEX idx_user_missions_user ON public.user_missions (user_id, created_at DESC);

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missions"
  ON public.user_missions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own missions"
  ON public.user_missions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own missions"
  ON public.user_missions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own missions"
  ON public.user_missions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER set_user_missions_updated_at
  BEFORE UPDATE ON public.user_missions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 2. weekly_snapshots — weekly history
CREATE TABLE public.weekly_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  planned_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  carryover JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_score NUMERIC,
  prep_index NUMERIC,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_weekly_snapshots_user_week
  ON public.weekly_snapshots (user_id, week_start);

ALTER TABLE public.weekly_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON public.weekly_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own snapshots"
  ON public.weekly_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snapshots"
  ON public.weekly_snapshots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
