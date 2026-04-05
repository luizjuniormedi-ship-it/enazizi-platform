
-- 1. user_activity_log — behavioral tracking
CREATE TABLE public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_user ON public.user_activity_log (user_id, created_at DESC);
CREATE INDEX idx_activity_log_event ON public.user_activity_log (event_type, created_at DESC);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON public.user_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can log own activity"
  ON public.user_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Add freeze_available to user_gamification
ALTER TABLE public.user_gamification
  ADD COLUMN IF NOT EXISTS freeze_available INT NOT NULL DEFAULT 1;
