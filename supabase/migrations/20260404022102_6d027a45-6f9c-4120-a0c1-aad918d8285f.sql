-- Dashboard snapshots for server-side cache
CREATE TABLE public.dashboard_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can read their own snapshot
CREATE POLICY "Users can read own snapshot"
ON public.dashboard_snapshots
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can upsert their own snapshot
CREATE POLICY "Users can upsert own snapshot"
ON public.dashboard_snapshots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snapshot"
ON public.dashboard_snapshots
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX idx_dashboard_snapshots_user_id ON public.dashboard_snapshots (user_id);
CREATE INDEX idx_dashboard_snapshots_updated_at ON public.dashboard_snapshots (updated_at);