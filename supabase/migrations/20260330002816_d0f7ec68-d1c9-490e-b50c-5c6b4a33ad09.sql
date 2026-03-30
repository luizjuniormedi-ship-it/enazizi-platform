
-- Add institutional roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'institutional_admin';
