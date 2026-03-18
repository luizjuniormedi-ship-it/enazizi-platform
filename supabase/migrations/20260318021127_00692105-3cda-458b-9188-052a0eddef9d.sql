
CREATE TABLE public.video_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  room_code text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Sala de Aula',
  status text NOT NULL DEFAULT 'active',
  faculdade_filter text,
  periodo_filter integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone
);

ALTER TABLE public.video_rooms ENABLE ROW LEVEL SECURITY;

-- Professors can manage own rooms
CREATE POLICY "Professors can manage own video rooms"
ON public.video_rooms FOR ALL TO authenticated
USING (professor_id = auth.uid())
WITH CHECK (professor_id = auth.uid());

-- All authenticated can read active rooms
CREATE POLICY "Authenticated can read active video rooms"
ON public.video_rooms FOR SELECT TO authenticated
USING (status = 'active');

-- Admins can read all
CREATE POLICY "Admins can read all video rooms"
ON public.video_rooms FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
