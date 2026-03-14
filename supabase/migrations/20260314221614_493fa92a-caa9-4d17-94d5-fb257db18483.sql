CREATE POLICY "Users can read global questions"
ON public.questions_bank
FOR SELECT
TO authenticated
USING (is_global = true);