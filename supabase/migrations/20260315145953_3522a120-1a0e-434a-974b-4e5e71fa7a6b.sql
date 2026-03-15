
CREATE TABLE public.user_presence (
  user_id UUID PRIMARY KEY,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_page TEXT
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upsert own presence"
ON public.user_presence FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all presence"
ON public.user_presence FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
