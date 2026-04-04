-- Drop policies that reference user_id
DROP POLICY IF EXISTS "Users can insert own AI usage logs" ON public.ai_usage_logs;

-- Change user_id to text
ALTER TABLE public.ai_usage_logs ALTER COLUMN user_id TYPE text USING user_id::text;

-- Recreate insert policy
CREATE POLICY "Users can insert own AI usage logs"
ON public.ai_usage_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'system%');
