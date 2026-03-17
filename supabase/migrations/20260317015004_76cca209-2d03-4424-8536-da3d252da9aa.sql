-- Fix RLS: change chat_messages and practice_attempts from public to authenticated

DROP POLICY IF EXISTS "Users can CRUD own messages" ON public.chat_messages;
CREATE POLICY "Users can CRUD own messages"
  ON public.chat_messages
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can CRUD own attempts" ON public.practice_attempts;
CREATE POLICY "Users can CRUD own attempts"
  ON public.practice_attempts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());