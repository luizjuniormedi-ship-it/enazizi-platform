
-- Mentoria de Temas: plano do professor
CREATE TABLE public.mentor_theme_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  exam_date date,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_theme_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors manage own plans" ON public.mentor_theme_plans
  FOR ALL TO authenticated
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

CREATE POLICY "Admins manage all plans" ON public.mentor_theme_plans
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_mentor_theme_plans_updated_at
  BEFORE UPDATE ON public.mentor_theme_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Tópicos da mentoria
CREATE TABLE public.mentor_theme_plan_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.mentor_theme_plans(id) ON DELETE CASCADE,
  topic text NOT NULL,
  subtopic text,
  priority integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_theme_plan_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors manage topics of own plans" ON public.mentor_theme_plan_topics
  FOR ALL TO authenticated
  USING (plan_id IN (SELECT id FROM public.mentor_theme_plans WHERE professor_id = auth.uid()))
  WITH CHECK (plan_id IN (SELECT id FROM public.mentor_theme_plans WHERE professor_id = auth.uid()));

CREATE POLICY "Admins manage all topics" ON public.mentor_theme_plan_topics
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Alvos da mentoria (aluno, turma ou instituição)
CREATE TABLE public.mentor_theme_plan_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.mentor_theme_plans(id) ON DELETE CASCADE,
  target_type text NOT NULL DEFAULT 'student',
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, target_type, target_id)
);

ALTER TABLE public.mentor_theme_plan_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors manage targets of own plans" ON public.mentor_theme_plan_targets
  FOR ALL TO authenticated
  USING (plan_id IN (SELECT id FROM public.mentor_theme_plans WHERE professor_id = auth.uid()))
  WITH CHECK (plan_id IN (SELECT id FROM public.mentor_theme_plans WHERE professor_id = auth.uid()));

CREATE POLICY "Admins manage all targets" ON public.mentor_theme_plan_targets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Students can read targets that include them
CREATE POLICY "Students can read own targets" ON public.mentor_theme_plan_targets
  FOR SELECT TO authenticated
  USING (
    (target_type = 'student' AND target_id = auth.uid())
    OR (target_type = 'class' AND target_id IN (
      SELECT class_id FROM public.class_members WHERE user_id = auth.uid() AND is_active = true
    ))
    OR (target_type = 'institution' AND target_id = user_institution_id(auth.uid()))
  );

-- Students can read plans they are targeted by
CREATE POLICY "Students can read targeted plans" ON public.mentor_theme_plans
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT plan_id FROM public.mentor_theme_plan_targets
      WHERE (target_type = 'student' AND target_id = auth.uid())
         OR (target_type = 'class' AND target_id IN (
              SELECT class_id FROM public.class_members WHERE user_id = auth.uid() AND is_active = true
            ))
         OR (target_type = 'institution' AND target_id = user_institution_id(auth.uid()))
    )
  );

-- Students can read topics of targeted plans
CREATE POLICY "Students can read targeted topics" ON public.mentor_theme_plan_topics
  FOR SELECT TO authenticated
  USING (
    plan_id IN (
      SELECT plan_id FROM public.mentor_theme_plan_targets
      WHERE (target_type = 'student' AND target_id = auth.uid())
         OR (target_type = 'class' AND target_id IN (
              SELECT class_id FROM public.class_members WHERE user_id = auth.uid() AND is_active = true
            ))
         OR (target_type = 'institution' AND target_id = user_institution_id(auth.uid()))
    )
  );

-- Progresso do aluno nos temas da mentoria
CREATE TABLE public.mentor_theme_plan_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.mentor_theme_plans(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.mentor_theme_plan_topics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  questions_answered integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  study_time_minutes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, topic_id, user_id)
);

ALTER TABLE public.mentor_theme_plan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own progress" ON public.mentor_theme_plan_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Professors read progress of own plans" ON public.mentor_theme_plan_progress
  FOR SELECT TO authenticated
  USING (plan_id IN (SELECT id FROM public.mentor_theme_plans WHERE professor_id = auth.uid()));

CREATE POLICY "Admins manage all progress" ON public.mentor_theme_plan_progress
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_mentor_progress_updated_at
  BEFORE UPDATE ON public.mentor_theme_plan_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index for fast lookups
CREATE INDEX idx_mentor_targets_plan ON public.mentor_theme_plan_targets(plan_id);
CREATE INDEX idx_mentor_targets_target ON public.mentor_theme_plan_targets(target_type, target_id);
CREATE INDEX idx_mentor_progress_plan_user ON public.mentor_theme_plan_progress(plan_id, user_id);
CREATE INDEX idx_mentor_topics_plan ON public.mentor_theme_plan_topics(plan_id);
