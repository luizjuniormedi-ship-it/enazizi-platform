
CREATE TABLE public.study_action_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id UUID,
  task_id TEXT,
  task_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'auto',
  origin_module TEXT NOT NULL,
  affected_table TEXT,
  affected_record_id TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  payload_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_action_events_user ON public.study_action_events(user_id);
CREATE INDEX idx_study_action_events_created ON public.study_action_events(created_at DESC);
CREATE INDEX idx_study_action_events_type ON public.study_action_events(task_type);

ALTER TABLE public.study_action_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study events"
  ON public.study_action_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study events"
  ON public.study_action_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
