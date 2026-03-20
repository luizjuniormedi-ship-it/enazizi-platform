
CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ratings jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.user_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own feedback"
  ON public.user_feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all feedback"
  ON public.user_feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
