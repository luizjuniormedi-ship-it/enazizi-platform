
-- 1. clinical_scenarios — reusable scenario templates
CREATE TABLE public.clinical_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medio',
  scenario_type TEXT NOT NULL DEFAULT 'plantao', -- plantao | anamnese
  scenario_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own or global scenarios" ON public.clinical_scenarios
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_global = true);

CREATE POLICY "Admins can manage all scenarios" ON public.clinical_scenarios
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. simulation_sessions — tracks Plantão sessions with origin
CREATE TABLE public.simulation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_id UUID REFERENCES public.clinical_scenarios(id) ON DELETE SET NULL,
  session_origin TEXT NOT NULL DEFAULT 'manual', -- manual | guided | assigned
  specialty TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medio',
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | completed | abandoned
  final_score INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.simulation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own simulation sessions" ON public.simulation_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all simulation sessions" ON public.simulation_sessions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. anamnesis_sessions — tracks Anamnese sessions with origin
CREATE TABLE public.anamnesis_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_id UUID REFERENCES public.clinical_scenarios(id) ON DELETE SET NULL,
  session_origin TEXT NOT NULL DEFAULT 'manual', -- manual | guided | assigned
  specialty TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medio',
  status TEXT NOT NULL DEFAULT 'in_progress',
  final_score INTEGER,
  categories_covered JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.anamnesis_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own anamnesis sessions" ON public.anamnesis_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all anamnesis sessions" ON public.anamnesis_sessions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. anamnesis_interactions — individual Q&A within an anamnesis session
CREATE TABLE public.anamnesis_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.anamnesis_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT,
  question_text TEXT NOT NULL,
  patient_response TEXT,
  quality_score INTEGER, -- 0-3 stars
  coaching_tip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.anamnesis_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own interactions" ON public.anamnesis_interactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
