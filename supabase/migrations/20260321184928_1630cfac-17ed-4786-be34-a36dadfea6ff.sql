DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_feedback' AND policyname = 'Admins can read all feedbacks'
  ) THEN
    CREATE POLICY "Admins can read all feedbacks"
      ON public.user_feedback FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$