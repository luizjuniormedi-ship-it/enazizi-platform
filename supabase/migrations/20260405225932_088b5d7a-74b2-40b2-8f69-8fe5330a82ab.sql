
ALTER TABLE public.study_action_events
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS subtopic text,
  ADD COLUMN IF NOT EXISTS error_message text;

ALTER TABLE public.study_action_events
  ADD CONSTRAINT study_action_events_source_check CHECK (source IN ('auto', 'manual')),
  ADD CONSTRAINT study_action_events_status_check CHECK (status IN ('success', 'error'));
