-- Add target_exams array column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_exams text[] DEFAULT '{}';

-- Migrate existing data from target_exam to target_exams
UPDATE public.profiles
SET target_exams = ARRAY[target_exam]
WHERE target_exam IS NOT NULL AND target_exam != '' AND (target_exams IS NULL OR target_exams = '{}');