-- Admin read policies for CEO dashboard
CREATE POLICY "Admins can read all module_sessions"
  ON public.module_sessions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all practice_attempts"
  ON public.practice_attempts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all revisoes"
  ON public.revisoes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all chat_conversations"
  ON public.chat_conversations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all clinical_cases"
  ON public.clinical_cases FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all chronicle_osce_sessions"
  ON public.chronicle_osce_sessions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all daily_plans"
  ON public.daily_plans FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));