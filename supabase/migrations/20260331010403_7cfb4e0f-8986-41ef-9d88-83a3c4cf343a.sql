
-- Delete questions with invalid options (not arrays, or wrong count)
DELETE FROM public.questions_bank
WHERE options IS NULL
   OR jsonb_typeof(options) != 'array'
   OR jsonb_array_length(options) < 4
   OR jsonb_array_length(options) > 5;

-- Add image_url column for future image support
ALTER TABLE public.questions_bank ADD COLUMN IF NOT EXISTS image_url text;
