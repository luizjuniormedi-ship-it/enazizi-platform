
-- Gamification table: XP, level, streak tracking
CREATE TABLE public.user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  weekly_xp integer NOT NULL DEFAULT 0,
  weekly_reset_at timestamp with time zone NOT NULL DEFAULT date_trunc('week', now()) + interval '7 days',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own gamification" ON public.user_gamification FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own gamification" ON public.user_gamification FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own gamification" ON public.user_gamification FOR UPDATE TO authenticated USING (user_id = auth.uid());
-- Allow reading all for ranking
CREATE POLICY "Authenticated can read all for ranking" ON public.user_gamification FOR SELECT TO authenticated USING (true);

-- Achievements table
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_key text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Enable realtime for ranking updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_gamification;
