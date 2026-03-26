
-- 1. UPLOADS: restrict SELECT to owner or global
DROP POLICY IF EXISTS "All authenticated can read uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can read own or global uploads" ON public.uploads;
CREATE POLICY "Users can read own or global uploads" ON public.uploads
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR (is_global = true));

-- 2. FLASHCARDS: restrict SELECT to owner or global
DROP POLICY IF EXISTS "All authenticated can read all flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can read own or global flashcards" ON public.flashcards;
CREATE POLICY "Users can read own or global flashcards" ON public.flashcards
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR (is_global = true));

-- 3. SUMMARIES: restrict SELECT to owner only (no is_global column)
DROP POLICY IF EXISTS "All authenticated can read summaries" ON public.summaries;
DROP POLICY IF EXISTS "Users can read own summaries" ON public.summaries;
CREATE POLICY "Users can read own summaries" ON public.summaries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4. CLINICAL_CASES: restrict SELECT to owner or global
DROP POLICY IF EXISTS "All authenticated can read clinical cases" ON public.clinical_cases;
DROP POLICY IF EXISTS "Users can read own or global clinical cases" ON public.clinical_cases;
CREATE POLICY "Users can read own or global clinical cases" ON public.clinical_cases
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR (is_global = true));

-- 5. CHAT_CONVERSATIONS: change role from public to authenticated
DROP POLICY IF EXISTS "Users can CRUD own conversations" ON public.chat_conversations;
CREATE POLICY "Users can CRUD own conversations" ON public.chat_conversations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. USER_ROLES: block non-admin writes, restrict INSERT to service_role
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can insert roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert roles" ON public.user_roles
  FOR INSERT TO service_role
  WITH CHECK (true);
