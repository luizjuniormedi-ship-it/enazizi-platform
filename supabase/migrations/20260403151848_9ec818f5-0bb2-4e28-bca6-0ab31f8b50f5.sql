-- Table: medical_chronicles
CREATE TABLE public.medical_chronicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  specialty TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'avancado',
  content TEXT NOT NULL,
  structured_data JSONB,
  osce_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_chronicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chronicles"
  ON public.medical_chronicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chronicles"
  ON public.medical_chronicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chronicles"
  ON public.medical_chronicles FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_medical_chronicles_user ON public.medical_chronicles(user_id);
CREATE INDEX idx_medical_chronicles_specialty ON public.medical_chronicles(specialty);

-- Table: chronicle_osce_sessions
CREATE TABLE public.chronicle_osce_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chronicle_id UUID NOT NULL REFERENCES public.medical_chronicles(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  evaluation JSONB,
  decisions JSONB,
  time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chronicle_osce_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own osce sessions"
  ON public.chronicle_osce_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own osce sessions"
  ON public.chronicle_osce_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_chronicle_osce_user ON public.chronicle_osce_sessions(user_id);
CREATE INDEX idx_chronicle_osce_chronicle ON public.chronicle_osce_sessions(chronicle_id);