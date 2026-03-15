
-- 1. Update handle_new_user to also create user_quotas and user_gamification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 'pending');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.user_gamification (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.user_quotas (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 2. Backfill user_gamification for all existing users who don't have it
INSERT INTO public.user_gamification (user_id)
SELECT p.user_id FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_gamification ug WHERE ug.user_id = p.user_id
)
ON CONFLICT DO NOTHING;

-- 3. Backfill user_quotas for all existing users who don't have it
INSERT INTO public.user_quotas (user_id)
SELECT p.user_id FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_quotas uq WHERE uq.user_id = p.user_id
)
ON CONFLICT DO NOTHING;

-- 4. Add unique constraint on user_id for user_gamification and user_quotas to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_gamification_user_id_key') THEN
    ALTER TABLE public.user_gamification ADD CONSTRAINT user_gamification_user_id_key UNIQUE (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_quotas_user_id_key') THEN
    ALTER TABLE public.user_quotas ADD CONSTRAINT user_quotas_user_id_key UNIQUE (user_id);
  END IF;
END $$;
