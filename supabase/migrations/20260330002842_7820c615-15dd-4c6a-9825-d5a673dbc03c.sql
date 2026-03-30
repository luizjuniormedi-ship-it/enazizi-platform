
-- Institutions table
CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'faculdade',
  logo_url text,
  settings_json jsonb DEFAULT '{}'::jsonb,
  max_users integer DEFAULT 500,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- Institution members
CREATE TABLE public.institution_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'student',
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(institution_id, user_id)
);

ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;

-- Classes (turmas)
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  period integer,
  year integer DEFAULT EXTRACT(YEAR FROM now()),
  invite_code text UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Class members (students + professors linked to class)
CREATE TABLE public.class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'student',
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(class_id, user_id)
);

ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- Security definer functions for institutional access
CREATE OR REPLACE FUNCTION public.user_institution_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.institution_members
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.user_is_institution_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE user_id = _user_id AND is_active = true
    AND role IN ('professor', 'coordinator', 'institutional_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.users_share_institution(_user_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_members a
    JOIN public.institution_members b ON a.institution_id = b.institution_id
    WHERE a.user_id = _user_id AND b.user_id = _target_user_id
    AND a.is_active = true AND b.is_active = true
  )
$$;

-- RLS Policies for institutions
CREATE POLICY "Staff can read own institution" ON public.institutions
  FOR SELECT TO authenticated
  USING (id = public.user_institution_id(auth.uid()));

CREATE POLICY "Inst admins can update own institution" ON public.institutions
  FOR UPDATE TO authenticated
  USING (id = public.user_institution_id(auth.uid()) AND public.has_role(auth.uid(), 'institutional_admin'));

CREATE POLICY "Platform admins can manage all" ON public.institutions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS for institution_members
CREATE POLICY "Staff can read institution members" ON public.institution_members
  FOR SELECT TO authenticated
  USING (institution_id = public.user_institution_id(auth.uid()));

CREATE POLICY "Inst admins can manage members" ON public.institution_members
  FOR ALL TO authenticated
  USING (institution_id = public.user_institution_id(auth.uid()) AND public.user_is_institution_staff(auth.uid()))
  WITH CHECK (institution_id = public.user_institution_id(auth.uid()) AND public.user_is_institution_staff(auth.uid()));

CREATE POLICY "Platform admins manage all members" ON public.institution_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS for classes
CREATE POLICY "Institution members can read classes" ON public.classes
  FOR SELECT TO authenticated
  USING (institution_id = public.user_institution_id(auth.uid()));

CREATE POLICY "Staff can manage classes" ON public.classes
  FOR ALL TO authenticated
  USING (institution_id = public.user_institution_id(auth.uid()) AND public.user_is_institution_staff(auth.uid()))
  WITH CHECK (institution_id = public.user_institution_id(auth.uid()) AND public.user_is_institution_staff(auth.uid()));

CREATE POLICY "Platform admins manage all classes" ON public.classes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS for class_members
CREATE POLICY "Institution members can read class members" ON public.class_members
  FOR SELECT TO authenticated
  USING (class_id IN (SELECT id FROM public.classes WHERE institution_id = public.user_institution_id(auth.uid())));

CREATE POLICY "Staff can manage class members" ON public.class_members
  FOR ALL TO authenticated
  USING (class_id IN (SELECT id FROM public.classes WHERE institution_id = public.user_institution_id(auth.uid())) AND public.user_is_institution_staff(auth.uid()))
  WITH CHECK (class_id IN (SELECT id FROM public.classes WHERE institution_id = public.user_institution_id(auth.uid())) AND public.user_is_institution_staff(auth.uid()));

CREATE POLICY "Students can read own class membership" ON public.class_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Platform admins manage all class members" ON public.class_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
