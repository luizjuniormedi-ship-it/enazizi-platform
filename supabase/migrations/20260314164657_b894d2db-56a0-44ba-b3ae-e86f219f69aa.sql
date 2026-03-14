CREATE TABLE public.study_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema_atual text,
  questoes_respondidas integer NOT NULL DEFAULT 0,
  taxa_acerto numeric NOT NULL DEFAULT 0,
  pontuacao_discursiva numeric DEFAULT NULL,
  temas_fracos jsonb NOT NULL DEFAULT '[]'::jsonb,
  historico_estudo jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.study_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own performance" ON public.study_performance
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own performance" ON public.study_performance
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own performance" ON public.study_performance
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_study_performance_updated_at
  BEFORE UPDATE ON public.study_performance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();