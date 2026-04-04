
-- 1. curriculum_specialties
CREATE TABLE IF NOT EXISTS public.curriculum_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ciclo text NOT NULL DEFAULT 'clinico',
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.curriculum_specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read specialties" ON public.curriculum_specialties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service manages specialties" ON public.curriculum_specialties FOR ALL USING (true) WITH CHECK (true);

-- 2. curriculum_topics
CREATE TABLE IF NOT EXISTS public.curriculum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id uuid NOT NULL REFERENCES public.curriculum_specialties(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(specialty_id, nome)
);
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read topics" ON public.curriculum_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service manages topics" ON public.curriculum_topics FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_ct_specialty ON public.curriculum_topics(specialty_id);

-- 3. curriculum_subtopics
CREATE TABLE IF NOT EXISTS public.curriculum_subtopics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao_curta text,
  incidencia_geral text DEFAULT 'media',
  prioridade_base int DEFAULT 5,
  dificuldade_base int DEFAULT 3,
  tipo_cobranca text[] DEFAULT '{}',
  integra_com_pratica boolean DEFAULT false,
  integra_com_osce boolean DEFAULT false,
  integra_com_revisao_fsrs boolean DEFAULT true,
  gatilhos_clinicos text[] DEFAULT '{}',
  palavras_chave text[] DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(topic_id, nome)
);
ALTER TABLE public.curriculum_subtopics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read subtopics" ON public.curriculum_subtopics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service manages subtopics" ON public.curriculum_subtopics FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_csub_topic ON public.curriculum_subtopics(topic_id);

-- 4. curriculum_weights
CREATE TABLE IF NOT EXISTS public.curriculum_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id uuid NOT NULL REFERENCES public.curriculum_subtopics(id) ON DELETE CASCADE,
  banca text NOT NULL,
  peso int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subtopic_id, banca)
);
ALTER TABLE public.curriculum_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read weights" ON public.curriculum_weights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service manages weights" ON public.curriculum_weights FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_cw_subtopic ON public.curriculum_weights(subtopic_id);
CREATE INDEX idx_cw_banca ON public.curriculum_weights(banca);

-- 5. curriculum_prerequisites
CREATE TABLE IF NOT EXISTS public.curriculum_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id uuid NOT NULL REFERENCES public.curriculum_subtopics(id) ON DELETE CASCADE,
  prerequisite_subtopic_id uuid NOT NULL REFERENCES public.curriculum_subtopics(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subtopic_id, prerequisite_subtopic_id)
);
ALTER TABLE public.curriculum_prerequisites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read prereqs" ON public.curriculum_prerequisites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service manages prereqs" ON public.curriculum_prerequisites FOR ALL USING (true) WITH CHECK (true);

-- 6. performance_by_topic
CREATE TABLE IF NOT EXISTS public.performance_by_topic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  specialty text NOT NULL,
  topic text NOT NULL,
  subtopic text DEFAULT '',
  total_questions int NOT NULL DEFAULT 0,
  correct_questions int NOT NULL DEFAULT 0,
  accuracy numeric NOT NULL DEFAULT 0,
  average_response_time_ms int DEFAULT 0,
  last_activity_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.performance_by_topic ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own performance" ON public.performance_by_topic FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE UNIQUE INDEX idx_pbt_unique ON public.performance_by_topic(user_id, specialty, topic, subtopic);
CREATE INDEX idx_pbt_user ON public.performance_by_topic(user_id);
CREATE INDEX idx_pbt_specialty ON public.performance_by_topic(specialty);
CREATE INDEX idx_pbt_updated ON public.performance_by_topic(updated_at DESC);

-- Triggers updated_at
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['curriculum_subtopics','performance_by_topic'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();',
      t, t
    );
  END LOOP;
END $$;

-- Seeds: especialidades
INSERT INTO public.curriculum_specialties (nome, ciclo, ordem) VALUES
  ('Anatomia','basico',1),('Bioquímica','basico',2),('Embriologia','basico',3),
  ('Farmacologia','basico',4),('Fisiologia','basico',5),('Genética Médica','basico',6),
  ('Histologia','basico',7),('Imunologia','basico',8),('Microbiologia','basico',9),
  ('Parasitologia','basico',10),('Patologia','basico',11),('Semiologia','basico',12),
  ('Angiologia','clinico',1),('Cardiologia','clinico',2),('Dermatologia','clinico',3),
  ('Endocrinologia','clinico',4),('Gastroenterologia','clinico',5),('Hematologia','clinico',6),
  ('Infectologia','clinico',7),('Nefrologia','clinico',8),('Neurologia','clinico',9),
  ('Oftalmologia','clinico',10),('Oncologia','clinico',11),('Ortopedia','clinico',12),
  ('Otorrinolaringologia','clinico',13),('Pneumologia','clinico',14),('Psiquiatria','clinico',15),
  ('Reumatologia','clinico',16),('Urologia','clinico',17),
  ('Cirurgia','internato',1),('Ginecologia e Obstetrícia','internato',2),
  ('Medicina de Emergência','internato',3),('Medicina Preventiva','internato',4),
  ('Pediatria','internato',5),('Terapia Intensiva','internato',6)
ON CONFLICT (nome) DO NOTHING;
