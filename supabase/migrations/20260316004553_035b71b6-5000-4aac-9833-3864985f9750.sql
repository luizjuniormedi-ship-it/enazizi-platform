-- Drop the old global-only read policy
DROP POLICY IF EXISTS "Users can read global questions" ON public.questions_bank;

-- Create universal read policy: all authenticated users can read all questions
CREATE POLICY "All authenticated can read all questions"
  ON public.questions_bank FOR SELECT
  TO authenticated
  USING (true);

-- Same for flashcards
DROP POLICY IF EXISTS "Users can read global flashcards" ON public.flashcards;

CREATE POLICY "All authenticated can read all flashcards"
  ON public.flashcards FOR SELECT
  TO authenticated
  USING (true);