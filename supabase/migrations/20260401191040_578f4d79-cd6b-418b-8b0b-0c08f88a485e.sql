ALTER TABLE public.teacher_simulados
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auto_assign boolean DEFAULT true;