CREATE POLICY "All authenticated can read summaries"
ON public.summaries
FOR SELECT
TO authenticated
USING (true);