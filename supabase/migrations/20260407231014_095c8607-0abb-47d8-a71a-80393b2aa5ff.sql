
DO $$ BEGIN
  CREATE TYPE public.medical_image_type AS ENUM ('ecg','xray','ct','mri','us','dermatology','pathology','ophthalmology','endoscopy','obstetric_trace');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.image_review_status AS ENUM ('draft','validated','archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.image_question_status AS ENUM ('draft','validated','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.difficulty_level AS ENUM ('easy','medium','hard');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.medical_image_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code text UNIQUE NOT NULL,
  image_url text NOT NULL,
  thumbnail_url text,
  image_type public.medical_image_type NOT NULL,
  specialty text NOT NULL,
  subtopic text NOT NULL,
  diagnosis text NOT NULL,
  clinical_findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  distractors jsonb NOT NULL DEFAULT '[]'::jsonb,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  tri_a numeric NOT NULL DEFAULT 1.0,
  tri_b numeric NOT NULL DEFAULT 0.0,
  tri_c numeric NOT NULL DEFAULT 0.2,
  incidence_weight numeric NOT NULL DEFAULT 1.0,
  source_reference text,
  validated_by text,
  validated_at timestamptz,
  review_status public.image_review_status NOT NULL DEFAULT 'draft',
  version int NOT NULL DEFAULT 1,
  hash_integrity text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mia_image_type ON public.medical_image_assets(image_type);
CREATE INDEX IF NOT EXISTS idx_mia_specialty ON public.medical_image_assets(specialty);
CREATE INDEX IF NOT EXISTS idx_mia_difficulty ON public.medical_image_assets(difficulty);
CREATE INDEX IF NOT EXISTS idx_mia_review_status ON public.medical_image_assets(review_status);
CREATE INDEX IF NOT EXISTS idx_mia_is_active ON public.medical_image_assets(is_active);

ALTER TABLE public.medical_image_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read validated assets" ON public.medical_image_assets FOR SELECT USING (review_status = 'validated' AND is_active = true);

CREATE TABLE IF NOT EXISTS public.medical_image_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.medical_image_assets(id) ON DELETE CASCADE,
  question_code text UNIQUE NOT NULL,
  statement text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  option_e text,
  correct_index int NOT NULL,
  explanation text NOT NULL,
  rationale_map jsonb DEFAULT '{}'::jsonb,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  tri_a numeric NOT NULL DEFAULT 1.0,
  tri_b numeric NOT NULL DEFAULT 0.0,
  tri_c numeric NOT NULL DEFAULT 0.2,
  exam_style text NOT NULL DEFAULT 'generico',
  status public.image_question_status NOT NULL DEFAULT 'draft',
  validated_by text,
  validated_at timestamptz,
  language_code text NOT NULL DEFAULT 'pt-BR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_miq_asset_id ON public.medical_image_questions(asset_id);
CREATE INDEX IF NOT EXISTS idx_miq_difficulty ON public.medical_image_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_miq_status ON public.medical_image_questions(status);
CREATE INDEX IF NOT EXISTS idx_miq_exam_style ON public.medical_image_questions(exam_style);

ALTER TABLE public.medical_image_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published questions" ON public.medical_image_questions FOR SELECT USING (status = 'published');

CREATE TABLE IF NOT EXISTS public.medical_image_question_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.medical_image_questions(id) ON DELETE SET NULL,
  asset_id uuid REFERENCES public.medical_image_assets(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  actor text NOT NULL,
  notes text,
  old_payload jsonb,
  new_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_image_question_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read audit" ON public.medical_image_question_audit FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.exam_question_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.medical_image_questions(id) ON DELETE CASCADE,
  simulado_id text,
  user_id uuid NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  answered_correctly boolean,
  response_time_seconds numeric,
  confidence_level text
);

CREATE INDEX IF NOT EXISTS idx_equ_question_id ON public.exam_question_usage(question_id);
CREATE INDEX IF NOT EXISTS idx_equ_user_id ON public.exam_question_usage(user_id);

ALTER TABLE public.exam_question_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own usage" ON public.exam_question_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.exam_question_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_updated_at_mia BEFORE UPDATE ON public.medical_image_assets FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at_miq BEFORE UPDATE ON public.medical_image_questions FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
