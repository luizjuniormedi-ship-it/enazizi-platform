CREATE TABLE public.platform_config (
  id int PRIMARY KEY CHECK (id = 1),
  telegram_chat_id text,
  telegram_group_link text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_config (id) VALUES (1);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage platform config" ON public.platform_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read platform config" ON public.platform_config
  FOR SELECT TO authenticated
  USING (true);