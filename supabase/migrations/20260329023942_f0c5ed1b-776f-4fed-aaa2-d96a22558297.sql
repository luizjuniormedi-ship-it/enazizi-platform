
-- Add onboarding v2 fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS onboarding_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS experience_reset_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_onboarding_step integer DEFAULT 0;

-- Reset all existing users to trigger new onboarding (onboarding_version < 2)
UPDATE public.profiles SET onboarding_version = 1 WHERE onboarding_version IS NULL OR onboarding_version >= 2;

-- Archive old daily_plans (mark as archived, don't delete)
-- We'll handle study_tasks archiving via the app logic
