
-- Create teacher_clinical_cases table
CREATE TABLE public.teacher_clinical_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Caso Clínico',
  specialty TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'intermediário',
  time_limit_minutes INTEGER NOT NULL DEFAULT 20,
  case_prompt JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  faculdade_filter TEXT,
  periodo_filter INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_clinical_cases ENABLE ROW LEVEL SECURITY;

-- Professors CRUD own cases
CREATE POLICY "Professors can manage own clinical cases"
  ON public.teacher_clinical_cases FOR ALL
  TO authenticated
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

-- Admins can read all
CREATE POLICY "Admins can read all clinical cases teacher"
  ON public.teacher_clinical_cases FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create teacher_clinical_case_results table
CREATE TABLE public.teacher_clinical_case_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.teacher_clinical_cases(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  conversation_history JSONB DEFAULT '[]'::jsonb,
  final_evaluation JSONB DEFAULT '{}'::jsonb,
  final_score INTEGER DEFAULT 0,
  grade TEXT DEFAULT 'F',
  correct_diagnosis TEXT,
  student_got_diagnosis BOOLEAN DEFAULT false,
  time_total_minutes INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_clinical_case_results ENABLE ROW LEVEL SECURITY;

-- Students can manage own results
CREATE POLICY "Students can manage own clinical case results"
  ON public.teacher_clinical_case_results FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Security definer function to check if student has a clinical case result
CREATE OR REPLACE FUNCTION public.student_has_clinical_case_result(_user_id uuid, _case_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_clinical_case_results
    WHERE student_id = _user_id AND case_id = _case_id
  )
$$;

-- Students can read assigned cases (via results)
CREATE POLICY "Students can read assigned clinical cases"
  ON public.teacher_clinical_cases FOR SELECT
  TO authenticated
  USING (public.student_has_clinical_case_result(auth.uid(), id));

-- Professors can read results of own cases
CREATE OR REPLACE FUNCTION public.professor_owns_clinical_case(_user_id uuid, _case_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_clinical_cases
    WHERE id = _case_id AND professor_id = _user_id
  )
$$;

CREATE POLICY "Professors can read results of own cases"
  ON public.teacher_clinical_case_results FOR SELECT
  TO authenticated
  USING (public.professor_owns_clinical_case(auth.uid(), case_id));

-- Admins can read all results
CREATE POLICY "Admins can read all clinical case results"
  ON public.teacher_clinical_case_results FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
