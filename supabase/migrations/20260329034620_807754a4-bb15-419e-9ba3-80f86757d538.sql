
-- Indexes for mentor intelligence queries
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_scores_user_created ON public.approval_scores (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON public.daily_plans (user_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_revisoes_user_status_date ON public.revisoes (user_id, status, data_revisao);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_agent_created ON public.chat_conversations (agent_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_topic_profiles_user_accuracy ON public.user_topic_profiles (user_id, accuracy);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON public.ai_usage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_sessions_user_status ON public.simulation_sessions (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anamnesis_sessions_user_status ON public.anamnesis_sessions (user_id, status, created_at DESC);
