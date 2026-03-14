
CREATE TABLE public.error_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tema TEXT NOT NULL,
  subtema TEXT,
  tipo_questao TEXT NOT NULL DEFAULT 'objetiva',
  conteudo TEXT,
  motivo_erro TEXT,
  categoria_erro TEXT,
  dificuldade INTEGER DEFAULT 3,
  vezes_errado INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.error_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own errors" ON public.error_bank
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own errors" ON public.error_bank
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own errors" ON public.error_bank
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own errors" ON public.error_bank
  FOR DELETE TO authenticated USING (user_id = auth.uid());
