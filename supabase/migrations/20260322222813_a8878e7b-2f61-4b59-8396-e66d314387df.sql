ALTER TABLE public.error_bank ADD COLUMN IF NOT EXISTS dominado boolean DEFAULT false;
ALTER TABLE public.error_bank ADD COLUMN IF NOT EXISTS dominado_em timestamptz;