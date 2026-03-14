CREATE TABLE public.enazizi_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  estado_atual integer NOT NULL DEFAULT 1,
  tema_atual text,
  questoes_respondidas integer NOT NULL DEFAULT 0,
  taxa_acerto numeric NOT NULL DEFAULT 0,
  pontuacao_discursiva numeric DEFAULT 0,
  temas_fracos jsonb NOT NULL DEFAULT '[]'::jsonb,
  historico_estudo jsonb NOT NULL DEFAULT '[]'::jsonb,
  ultima_interacao timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.enazizi_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON public.enazizi_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own progress" ON public.enazizi_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own progress" ON public.enazizi_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_enazizi_progress_updated_at BEFORE UPDATE ON public.enazizi_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();