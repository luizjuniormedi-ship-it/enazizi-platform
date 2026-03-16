
CREATE TABLE public.simulation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  specialty TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'intermediário',
  final_score INTEGER NOT NULL DEFAULT 0,
  grade TEXT NOT NULL DEFAULT 'F',
  correct_diagnosis TEXT,
  student_got_diagnosis BOOLEAN NOT NULL DEFAULT false,
  time_total_minutes INTEGER NOT NULL DEFAULT 0,
  evaluation JSONB DEFAULT '{}'::jsonb,
  differential_diagnosis JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  ideal_approach TEXT,
  ideal_prescription TEXT,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.simulation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own simulations"
  ON public.simulation_history FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own simulations"
  ON public.simulation_history FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all simulations"
  ON public.simulation_history FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
