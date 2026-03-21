
CREATE TABLE public.medical_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'ecg',
  subcategory text,
  diagnosis text NOT NULL,
  difficulty integer NOT NULL DEFAULT 2,
  image_url text NOT NULL,
  image_source text,
  explanation text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer NOT NULL DEFAULT 0,
  tags text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read active images"
  ON public.medical_images FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage all images"
  ON public.medical_images FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.medical_image_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_id uuid NOT NULL REFERENCES public.medical_images(id) ON DELETE CASCADE,
  selected_index integer NOT NULL,
  correct boolean NOT NULL,
  time_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_image_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own attempts"
  ON public.medical_image_attempts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
