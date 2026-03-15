-- Add professor to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professor';

-- Table for professor-created simulados assigned to students
CREATE TABLE public.teacher_simulados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Simulado',
  description text,
  topics text[] NOT NULL DEFAULT '{}',
  faculdade_filter text,
  periodo_filter integer,
  total_questions integer NOT NULL DEFAULT 10,
  time_limit_minutes integer NOT NULL DEFAULT 60,
  questions_json jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_simulados ENABLE ROW LEVEL SECURITY;

-- Professors can CRUD their own simulados
CREATE POLICY "Professors can manage own simulados"
  ON public.teacher_simulados FOR ALL
  TO authenticated
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

-- Admins can read all
CREATE POLICY "Admins can read all teacher simulados"
  ON public.teacher_simulados FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Table for student results on teacher simulados
CREATE TABLE public.teacher_simulado_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulado_id uuid NOT NULL REFERENCES public.teacher_simulados(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  answers_json jsonb DEFAULT '[]',
  score numeric,
  total_questions integer NOT NULL DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_simulado_results ENABLE ROW LEVEL SECURITY;

-- Students can read/update their own results
CREATE POLICY "Students can manage own results"
  ON public.teacher_simulado_results FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Professors can read results of their simulados
CREATE POLICY "Professors can read results of own simulados"
  ON public.teacher_simulado_results FOR SELECT
  TO authenticated
  USING (simulado_id IN (SELECT id FROM public.teacher_simulados WHERE professor_id = auth.uid()));

-- Admins can read all results
CREATE POLICY "Admins can read all results"
  ON public.teacher_simulado_results FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
