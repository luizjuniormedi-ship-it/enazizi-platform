
-- FSRS card state table for tracking spaced repetition across all modules
CREATE TABLE public.fsrs_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL DEFAULT 'flashcard', -- flashcard, question, topic, clinical
  card_ref_id TEXT NOT NULL, -- reference to flashcard.id, question.id, etc.
  stability DOUBLE PRECISION NOT NULL DEFAULT 0.4,
  difficulty DOUBLE PRECISION NOT NULL DEFAULT 0.3,
  elapsed_days DOUBLE PRECISION NOT NULL DEFAULT 0,
  scheduled_days DOUBLE PRECISION NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  state INTEGER NOT NULL DEFAULT 0, -- 0=New, 1=Learning, 2=Review, 3=Relearning
  due TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_review TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_type, card_ref_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_fsrs_cards_user_due ON public.fsrs_cards(user_id, due);
CREATE INDEX idx_fsrs_cards_user_type ON public.fsrs_cards(user_id, card_type);
CREATE INDEX idx_fsrs_cards_state ON public.fsrs_cards(user_id, state);

-- Review log for analytics
CREATE TABLE public.fsrs_review_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.fsrs_cards(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL, -- 1=Again, 2=Hard, 3=Good, 4=Easy
  scheduled_days DOUBLE PRECISION,
  elapsed_days DOUBLE PRECISION,
  review_duration_ms INTEGER,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fsrs_review_log_card ON public.fsrs_review_log(card_id);
CREATE INDEX idx_fsrs_review_log_user ON public.fsrs_review_log(user_id, reviewed_at);

-- RLS
ALTER TABLE public.fsrs_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fsrs_review_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own FSRS cards"
  ON public.fsrs_cards FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own FSRS logs"
  ON public.fsrs_review_log FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
