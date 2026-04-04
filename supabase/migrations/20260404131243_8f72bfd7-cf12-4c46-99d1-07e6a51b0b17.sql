
-- Matriz Curricular Mestra do ENAZIZI
CREATE TABLE public.curriculum_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  especialidade text NOT NULL,
  tema text NOT NULL,
  subtema text NOT NULL,
  descricao_curta text,
  incidencia_geral text NOT NULL DEFAULT 'media',
  prioridade_base int NOT NULL DEFAULT 5 CHECK (prioridade_base BETWEEN 1 AND 10),
  tipo_cobranca text[] NOT NULL DEFAULT '{}',
  dificuldade_base int NOT NULL DEFAULT 3 CHECK (dificuldade_base BETWEEN 1 AND 5),
  peso_banca_enare int NOT NULL DEFAULT 5 CHECK (peso_banca_enare BETWEEN 1 AND 10),
  peso_banca_usp int NOT NULL DEFAULT 5 CHECK (peso_banca_usp BETWEEN 1 AND 10),
  peso_banca_sus_sp int NOT NULL DEFAULT 5 CHECK (peso_banca_sus_sp BETWEEN 1 AND 10),
  peso_banca_unicamp int NOT NULL DEFAULT 5 CHECK (peso_banca_unicamp BETWEEN 1 AND 10),
  peso_banca_unifesp int NOT NULL DEFAULT 5 CHECK (peso_banca_unifesp BETWEEN 1 AND 10),
  pre_requisitos text[] NOT NULL DEFAULT '{}',
  palavras_chave text[] NOT NULL DEFAULT '{}',
  gatilhos_clinicos text[] NOT NULL DEFAULT '{}',
  integra_com_pratica boolean NOT NULL DEFAULT false,
  integra_com_osce boolean NOT NULL DEFAULT false,
  integra_com_revisao_fsrs boolean NOT NULL DEFAULT true,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (especialidade, tema, subtema)
);

-- Índices para consultas frequentes
CREATE INDEX idx_curriculum_matrix_especialidade ON public.curriculum_matrix (especialidade);
CREATE INDEX idx_curriculum_matrix_incidencia ON public.curriculum_matrix (incidencia_geral);
CREATE INDEX idx_curriculum_matrix_prioridade ON public.curriculum_matrix (prioridade_base DESC);
CREATE INDEX idx_curriculum_matrix_ativo ON public.curriculum_matrix (ativo) WHERE ativo = true;

-- RLS
ALTER TABLE public.curriculum_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view curriculum"
  ON public.curriculum_matrix FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage curriculum"
  ON public.curriculum_matrix FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_curriculum_matrix_updated_at
  BEFORE UPDATE ON public.curriculum_matrix
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
