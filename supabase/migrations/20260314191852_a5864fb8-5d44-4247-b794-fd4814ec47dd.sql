
-- Medical domain map table
CREATE TABLE public.medical_domain_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  specialty TEXT NOT NULL,
  domain_score NUMERIC NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  clinical_cases_score NUMERIC NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  avg_difficulty NUMERIC NOT NULL DEFAULT 3,
  last_studied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, specialty)
);

-- Enable RLS
ALTER TABLE public.medical_domain_map ENABLE ROW LEVEL SECURITY;

-- Users can read own domain map
CREATE POLICY "Users can read own domain map" ON public.medical_domain_map
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Users can insert own domain map
CREATE POLICY "Users can insert own domain map" ON public.medical_domain_map
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Users can update own domain map
CREATE POLICY "Users can update own domain map" ON public.medical_domain_map
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Admins can read all
CREATE POLICY "Admins can read all domain maps" ON public.medical_domain_map
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
