
-- Table to store per-topic performance profiles for the Study Engine
CREATE TABLE public.user_topic_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  specialty text NOT NULL DEFAULT 'Geral',
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  accuracy numeric NOT NULL DEFAULT 0,
  confidence_level text NOT NULL DEFAULT 'baixo',
  last_practiced_at timestamptz,
  next_review_at timestamptz,
  review_interval_days integer NOT NULL DEFAULT 1,
  mastery_level integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic)
);

ALTER TABLE public.user_topic_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own topic profiles"
  ON public.user_topic_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all topic profiles"
  ON public.user_topic_profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
