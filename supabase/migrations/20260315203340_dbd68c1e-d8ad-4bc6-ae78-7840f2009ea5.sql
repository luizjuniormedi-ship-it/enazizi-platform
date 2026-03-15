ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS periodo integer DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faculdade text DEFAULT NULL;