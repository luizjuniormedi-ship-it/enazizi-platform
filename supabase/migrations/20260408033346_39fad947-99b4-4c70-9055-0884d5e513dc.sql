
CREATE TABLE public.simulado_question_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  simulado_session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  question_index INT NOT NULL,
  question_id TEXT,
  bank_question_id UUID,
  image_question_id UUID,
  mode TEXT NOT NULL DEFAULT 'text' CHECK (mode IN ('image', 'text', 'fallback_text')),
  image_type TEXT,
  specialty TEXT,
  subtopic TEXT,
  difficulty TEXT,
  exam_style TEXT,
  selected_answer INT,
  correct_answer INT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  response_time_seconds NUMERIC(8,2),
  viewed_explanation BOOLEAN DEFAULT false,
  used_zoom BOOLEAN DEFAULT false,
  changed_answer BOOLEAN DEFAULT false,
  retried_image BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sqa_user ON public.simulado_question_analytics(user_id);
CREATE INDEX idx_sqa_session ON public.simulado_question_analytics(simulado_session_id);
CREATE INDEX idx_sqa_mode ON public.simulado_question_analytics(mode);
CREATE INDEX idx_sqa_image_type ON public.simulado_question_analytics(image_type);
CREATE INDEX idx_sqa_created ON public.simulado_question_analytics(created_at);

ALTER TABLE public.simulado_question_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
ON public.simulado_question_analytics FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
ON public.simulado_question_analytics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics"
ON public.simulado_question_analytics FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
