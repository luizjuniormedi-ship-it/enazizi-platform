
-- Add columns to temas_estudados
ALTER TABLE public.temas_estudados
  ADD COLUMN IF NOT EXISTS subtopico text,
  ADD COLUMN IF NOT EXISTS dificuldade text DEFAULT 'medio',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo';

-- Add columns to revisoes
ALTER TABLE public.revisoes
  ADD COLUMN IF NOT EXISTS prioridade numeric DEFAULT 50,
  ADD COLUMN IF NOT EXISTS risco_esquecimento text DEFAULT 'baixo';

-- Add columns to desempenho_questoes
ALTER TABLE public.desempenho_questoes
  ADD COLUMN IF NOT EXISTS tempo_gasto integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nivel_confianca text DEFAULT 'parcial',
  ADD COLUMN IF NOT EXISTS observacoes text;

-- Create cronograma config table
CREATE TABLE IF NOT EXISTS public.cronograma_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  revisoes_extras_ativas boolean DEFAULT true,
  max_revisoes_dia integer DEFAULT 10,
  meta_questoes_dia integer DEFAULT 30,
  meta_revisoes_semana integer DEFAULT 15,
  mostrar_concluidos boolean DEFAULT false,
  pesos_algoritmo jsonb DEFAULT '{"erro": 0.3, "tempo": 0.2, "atraso": 0.2, "dificuldade": 0.15, "confianca": 0.15}'::jsonb,
  dias_revisao jsonb DEFAULT '{"D1": 1, "D3": 3, "D7": 7, "D15": 15, "D30": 30}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.cronograma_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own cronograma config"
  ON public.cronograma_config
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
