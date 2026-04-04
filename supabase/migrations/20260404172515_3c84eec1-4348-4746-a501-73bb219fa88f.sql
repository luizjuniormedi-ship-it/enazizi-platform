
-- 1. Unique constraint on conversation_id to prevent duplicate sessions
ALTER TABLE public.tutor_sessions
  ADD CONSTRAINT tutor_sessions_conversation_id_unique UNIQUE (conversation_id);

-- 2. Add tutor_session_id to context_snapshots
ALTER TABLE public.tutor_context_snapshots
  ADD COLUMN IF NOT EXISTS tutor_session_id uuid REFERENCES public.tutor_sessions(id) ON DELETE SET NULL;

-- 3. Index for snapshot lookups by session
CREATE INDEX IF NOT EXISTS idx_tutor_context_snapshots_session
  ON public.tutor_context_snapshots (tutor_session_id)
  WHERE tutor_session_id IS NOT NULL;
