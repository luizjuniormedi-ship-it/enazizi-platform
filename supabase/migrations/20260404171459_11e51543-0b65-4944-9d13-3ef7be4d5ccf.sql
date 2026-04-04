
-- 1. Drop ALL policies (needed before ALTER TYPE)
DROP POLICY IF EXISTS "Users can insert own AI usage logs" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Users can view own AI usage logs" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Admins can view all AI usage logs" ON public.ai_usage_logs;

-- 2. Drop NOT NULL first so we can set NULLs
ALTER TABLE public.ai_usage_logs ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add actor columns
ALTER TABLE public.ai_usage_logs
  ADD COLUMN IF NOT EXISTS actor_type text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS actor_key text;

-- 4. Migrate non-UUID user_ids → actor_key, set user_id NULL
UPDATE public.ai_usage_logs
SET actor_type = 'system',
    actor_key = user_id,
    user_id = NULL
WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 5. Convert user_id text → uuid
ALTER TABLE public.ai_usage_logs ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 6. Recreate RLS policies
CREATE POLICY "Users can view own AI usage logs"
ON public.ai_usage_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage logs"
ON public.ai_usage_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 7. Index for system actor lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_actor
ON public.ai_usage_logs (actor_type, actor_key)
WHERE actor_type != 'user';

COMMENT ON COLUMN public.ai_usage_logs.actor_type IS 'Type of actor: user, system, cron, edge';
COMMENT ON COLUMN public.ai_usage_logs.actor_key IS 'Identifier for non-user actors (e.g. daily-quiz, qa-bot)';
