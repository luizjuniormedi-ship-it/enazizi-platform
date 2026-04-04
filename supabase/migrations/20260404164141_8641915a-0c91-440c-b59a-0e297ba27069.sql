
-- =====================================================
-- question_topic_map — ponte entre questões e currículo
-- =====================================================
CREATE TABLE IF NOT EXISTS public.question_topic_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK para a questão original
  question_id uuid NOT NULL REFERENCES public.questions_bank(id) ON DELETE CASCADE,
  -- Texto original do campo topic (preserva legado)
  mapped_topic_text text,
  -- Vínculos opcionais ao currículo oficial
  topic_id uuid REFERENCES public.curriculum_topics(id) ON DELETE SET NULL,
  subtopic_id uuid REFERENCES public.curriculum_subtopics(id) ON DELETE SET NULL,
  -- Confiança do mapeamento: 0 = não mapeado, 1 = confirmado manualmente
  confidence numeric NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  -- Metadados
  mapping_source text DEFAULT 'backfill',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Uma questão só pode ter um mapeamento
CREATE UNIQUE INDEX IF NOT EXISTS idx_qtm_question_unique ON public.question_topic_map(question_id);
CREATE INDEX IF NOT EXISTS idx_qtm_topic ON public.question_topic_map(topic_id) WHERE topic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qtm_subtopic ON public.question_topic_map(subtopic_id) WHERE subtopic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qtm_confidence ON public.question_topic_map(confidence);

ALTER TABLE public.question_topic_map ENABLE ROW LEVEL SECURITY;

-- Leitura para authenticated
CREATE POLICY "Auth read question_topic_map"
  ON public.question_topic_map FOR SELECT TO authenticated
  USING (true);

-- Escrita apenas para service_role
CREATE POLICY "Service role manages question_topic_map"
  ON public.question_topic_map FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER set_qtm_updated_at
  BEFORE UPDATE ON public.question_topic_map
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
