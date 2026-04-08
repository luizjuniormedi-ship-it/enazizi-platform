
CREATE TABLE IF NOT EXISTS public.question_generation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  target_assets INTEGER NOT NULL DEFAULT 0,
  processed_assets INTEGER NOT NULL DEFAULT 0,
  generated_questions INTEGER NOT NULL DEFAULT 0,
  failed_assets INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  details JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.question_generation_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.question_generation_runs(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL,
  asset_code TEXT,
  image_type TEXT,
  diagnosis TEXT,
  status TEXT NOT NULL,
  generated_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.question_generation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_generation_run_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read generation runs" ON public.question_generation_runs FOR SELECT USING (true);
CREATE POLICY "Service role manages generation runs" ON public.question_generation_runs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read generation run items" ON public.question_generation_run_items FOR SELECT USING (true);
CREATE POLICY "Service role manages generation run items" ON public.question_generation_run_items FOR ALL USING (true) WITH CHECK (true);
