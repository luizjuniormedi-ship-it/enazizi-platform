-- Drop existing policy
DROP POLICY IF EXISTS "Users can CRUD own uploads" ON public.uploads;

-- Users can read ALL uploads (shared knowledge)
CREATE POLICY "All authenticated can read uploads"
ON public.uploads FOR SELECT
TO authenticated
USING (true);

-- Users can only insert their own uploads
CREATE POLICY "Users can insert own uploads"
ON public.uploads FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can only update their own uploads
CREATE POLICY "Users can update own uploads"
ON public.uploads FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can only delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON public.uploads FOR DELETE
TO authenticated
USING (user_id = auth.uid());