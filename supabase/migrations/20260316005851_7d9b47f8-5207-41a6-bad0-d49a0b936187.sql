-- Temas estudados
CREATE TABLE public.temas_estudados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tema text NOT NULL,
  especialidade text NOT NULL,
  data_estudo date NOT NULL DEFAULT CURRENT_DATE,
  fonte text DEFAULT 'literatura',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.temas_estudados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own temas" ON public.temas_estudados
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Revisões
CREATE TABLE public.revisoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tema_id uuid NOT NULL REFERENCES public.temas_estudados(id) ON DELETE CASCADE,
  tipo_revisao text NOT NULL, -- D1, D3, D7, D15, D30, D2, D5
  data_revisao date NOT NULL,
  status text NOT NULL DEFAULT 'pendente', -- pendente, concluida
  concluida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.revisoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own revisoes" ON public.revisoes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Desempenho por tema
CREATE TABLE public.desempenho_questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tema_id uuid NOT NULL REFERENCES public.temas_estudados(id) ON DELETE CASCADE,
  revisao_id uuid REFERENCES public.revisoes(id) ON DELETE SET NULL,
  questoes_feitas integer NOT NULL DEFAULT 0,
  questoes_erradas integer NOT NULL DEFAULT 0,
  taxa_acerto numeric NOT NULL DEFAULT 0,
  data_registro timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.desempenho_questoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own desempenho" ON public.desempenho_questoes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_temas_updated_at
  BEFORE UPDATE ON public.temas_estudados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();