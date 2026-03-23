
-- Table: admin messages
CREATE TABLE public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Table: admin message reads
CREATE TABLE public.admin_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.admin_messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.admin_message_reads ENABLE ROW LEVEL SECURITY;

-- RLS for admin_messages
CREATE POLICY "Admins can manage messages" ON public.admin_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can read own or broadcast messages" ON public.admin_messages
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR recipient_id IS NULL);

-- RLS for admin_message_reads
CREATE POLICY "Users can insert own reads" ON public.admin_message_reads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own reads" ON public.admin_message_reads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all reads" ON public.admin_message_reads
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
