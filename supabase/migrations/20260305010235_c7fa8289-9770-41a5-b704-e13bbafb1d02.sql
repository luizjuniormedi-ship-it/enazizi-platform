
-- Diagnostic results table
CREATE TABLE public.diagnostic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  results_json jsonb DEFAULT '{}',
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own diagnostic results" ON public.diagnostic_results FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Exam sessions table (timed simulados)
CREATE TABLE public.exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id),
  title text NOT NULL DEFAULT 'Simulado',
  total_questions integer NOT NULL DEFAULT 0,
  time_limit_minutes integer NOT NULL DEFAULT 180,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone,
  answers_json jsonb DEFAULT '[]',
  results_json jsonb DEFAULT '{}',
  score numeric,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own exam sessions" ON public.exam_sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- User quotas table
CREATE TABLE public.user_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  questions_used integer NOT NULL DEFAULT 0,
  questions_limit integer NOT NULL DEFAULT 50,
  transcription_minutes_used numeric NOT NULL DEFAULT 0,
  transcription_minutes_limit numeric NOT NULL DEFAULT 0,
  extra_questions integer NOT NULL DEFAULT 0,
  extra_transcription_minutes numeric NOT NULL DEFAULT 0,
  reset_at timestamp with time zone NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own quotas" ON public.user_quotas FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage quotas" ON public.user_quotas FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add global fields to questions_bank
ALTER TABLE public.questions_bank 
  ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS original_question_id uuid REFERENCES public.questions_bank(id),
  ADD COLUMN IF NOT EXISTS difficulty integer DEFAULT 3;

-- Performance predictions table
CREATE TABLE public.performance_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approval_probability numeric NOT NULL DEFAULT 0,
  estimated_score numeric NOT NULL DEFAULT 0,
  estimated_ranking integer,
  trend text DEFAULT 'stable',
  details_json jsonb DEFAULT '{}',
  predicted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.performance_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own predictions" ON public.performance_predictions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert predictions" ON public.performance_predictions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Add has_completed_diagnostic to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_diagnostic boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exam_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_specialty text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_study_hours numeric DEFAULT 4;
