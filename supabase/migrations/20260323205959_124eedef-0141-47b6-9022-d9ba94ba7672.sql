
-- Create tables first
CREATE TABLE IF NOT EXISTS public.teacher_study_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  title text NOT NULL,
  specialty text NOT NULL,
  topics_to_cover text NOT NULL,
  material_url text,
  material_filename text,
  faculdade_filter text,
  periodo_filter integer,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_study_assignment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.teacher_study_assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  questions_generated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Now create/replace the function
CREATE OR REPLACE FUNCTION public.student_has_study_assignment_result(_user_id uuid, _assignment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_study_assignment_results
    WHERE student_id = _user_id AND assignment_id = _assignment_id
  )
$$;

-- RLS for assignments
ALTER TABLE public.teacher_study_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can manage own study assignments"
  ON public.teacher_study_assignments FOR ALL TO authenticated
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

CREATE POLICY "Admins can read all study assignments"
  ON public.teacher_study_assignments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can read assigned study assignments"
  ON public.teacher_study_assignments FOR SELECT TO authenticated
  USING (public.student_has_study_assignment_result(auth.uid(), id));

-- RLS for results
ALTER TABLE public.teacher_study_assignment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own assignment results"
  ON public.teacher_study_assignment_results FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can read all assignment results"
  ON public.teacher_study_assignment_results FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Professors can read results of own assignments"
  ON public.teacher_study_assignment_results FOR SELECT TO authenticated
  USING (assignment_id IN (SELECT id FROM public.teacher_study_assignments WHERE professor_id = auth.uid()));

CREATE POLICY "Professors can insert results for own assignments"
  ON public.teacher_study_assignment_results FOR INSERT TO authenticated
  WITH CHECK (assignment_id IN (SELECT id FROM public.teacher_study_assignments WHERE professor_id = auth.uid()));
