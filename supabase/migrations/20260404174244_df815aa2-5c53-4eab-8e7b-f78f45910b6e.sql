-- Add user_id to recovery_events
ALTER TABLE public.recovery_events ADD COLUMN IF NOT EXISTS user_id uuid;

-- Backfill from recovery_runs
UPDATE public.recovery_events re
SET user_id = rr.user_id
FROM public.recovery_runs rr
WHERE re.recovery_run_id = rr.id AND re.user_id IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE public.recovery_events ALTER COLUMN user_id SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_recovery_events_user ON public.recovery_events (user_id);

-- Drop old restrictive policies first
DROP POLICY IF EXISTS "Service role manages recovery" ON public.recovery_runs;
DROP POLICY IF EXISTS "Service role manages recovery events" ON public.recovery_events;

-- Add user write policies
CREATE POLICY "Users can insert own recovery runs"
  ON public.recovery_runs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recovery runs"
  ON public.recovery_runs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recovery events"
  ON public.recovery_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Unique partial index: only 1 active run per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_recovery_runs_active_user
  ON public.recovery_runs (user_id) WHERE active = true;