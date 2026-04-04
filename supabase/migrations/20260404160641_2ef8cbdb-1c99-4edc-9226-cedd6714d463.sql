
-- =====================================================
-- 1. queue_results (nova tabela)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.queue_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.queue_jobs(id) ON DELETE CASCADE,
  result_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.queue_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read queue results"
  ON public.queue_results FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages queue results"
  ON public.queue_results FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_qr_job ON public.queue_results(job_id);

-- =====================================================
-- 2. ai_content_cache — colunas granulares de lookup
-- =====================================================
ALTER TABLE public.ai_content_cache
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS subtopic text,
  ADD COLUMN IF NOT EXISTS banca text,
  ADD COLUMN IF NOT EXISTS difficulty integer,
  ADD COLUMN IF NOT EXISTS module text,
  ADD COLUMN IF NOT EXISTS normalized_prompt_hash text;

CREATE INDEX IF NOT EXISTS idx_acc_granular
  ON public.ai_content_cache(module, specialty, topic, banca)
  WHERE specialty IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_acc_prompt_hash
  ON public.ai_content_cache(normalized_prompt_hash)
  WHERE normalized_prompt_hash IS NOT NULL;

-- =====================================================
-- 3. Índices complementares para escala
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_lesson_doubts_user ON public.lesson_doubts(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_doubts_lesson ON public.lesson_doubts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_worker_runs_job ON public.worker_runs(job_id);
CREATE INDEX IF NOT EXISTS idx_qj_scheduled ON public.queue_jobs(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_lesson_segments_lesson ON public.lesson_segments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id);
