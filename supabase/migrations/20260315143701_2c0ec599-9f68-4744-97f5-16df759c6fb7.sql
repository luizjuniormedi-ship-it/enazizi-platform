-- Add is_global column to flashcards
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false;

-- Allow all authenticated users to read global flashcards
CREATE POLICY "Users can read global flashcards"
ON public.flashcards
FOR SELECT
TO authenticated
USING (is_global = true);