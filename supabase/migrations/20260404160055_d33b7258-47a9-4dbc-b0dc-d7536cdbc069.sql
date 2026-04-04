
-- =====================================================
-- ENAZIZI — ESTRUTURA COMPLETA DE BANCO DE DADOS
-- Apenas tabelas e colunas NOVAS (preserva existentes)
-- =====================================================

-- ========== BLOCO 1: user_settings ==========
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  study_mode text NOT NULL DEFAULT 'adaptativo',
  theme_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  tutor_enabled boolean NOT NULL DEFAULT true,
  audio_mode_enabled boolean NOT NULL DEFAULT false,
  notifications_enabled boolean NOT NULL DEFAULT true,
  daily_goal_minutes int NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON public.user_settings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========== BLOCO 3: question_usage_logs ==========
CREATE TABLE IF NOT EXISTS public.question_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid,
  answered_correctly boolean,
  selected_answer int,
  response_time_ms int,
  source_mode text DEFAULT 'study',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.question_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own usage logs" ON public.question_usage_logs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_qul_user ON public.question_usage_logs(user_id);
CREATE INDEX idx_qul_question ON public.question_usage_logs(question_id);
CREATE INDEX idx_qul_created ON public.question_usage_logs(created_at DESC);

-- ========== question_quality_flags ==========
CREATE TABLE IF NOT EXISTS public.question_quality_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  flag_type text NOT NULL DEFAULT 'generic',
  flag_reason text,
  detected_by text NOT NULL DEFAULT 'system',
  status text NOT NULL DEFAULT 'open',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.question_quality_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage quality flags" ON public.question_quality_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages quality flags" ON public.question_quality_flags FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_qqf_question ON public.question_quality_flags(question_id);
CREATE INDEX idx_qqf_status ON public.question_quality_flags(status);

-- ========== BLOCO 5: daily_plan_tasks ==========
CREATE TABLE IF NOT EXISTS public.daily_plan_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id uuid NOT NULL REFERENCES public.daily_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  task_type text NOT NULL DEFAULT 'study',
  specialty text,
  topic text,
  subtopic text,
  title text NOT NULL,
  description text,
  quantity int DEFAULT 1,
  estimated_minutes int DEFAULT 15,
  action_type text DEFAULT 'questions',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  ordem int NOT NULL DEFAULT 0,
  priority text DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_plan_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plan tasks" ON public.daily_plan_tasks FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_dpt_plan ON public.daily_plan_tasks(daily_plan_id);
CREATE INDEX idx_dpt_user_date ON public.daily_plan_tasks(user_id);

-- ========== study_engine_snapshots ==========
CREATE TABLE IF NOT EXISTS public.study_engine_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prep_index numeric DEFAULT 0,
  approval_score numeric DEFAULT 0,
  phase text DEFAULT 'construcao',
  memory_pressure numeric DEFAULT 0,
  pending_reviews int DEFAULT 0,
  overdue_reviews int DEFAULT 0,
  content_lock boolean DEFAULT false,
  recovery_mode boolean DEFAULT false,
  heavy_recovery_active boolean DEFAULT false,
  heavy_recovery_phase int DEFAULT 0,
  chance_score numeric DEFAULT 0,
  weak_topics jsonb DEFAULT '[]'::jsonb,
  strong_topics jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.study_engine_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own snapshots" ON public.study_engine_snapshots FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Service role manages snapshots" ON public.study_engine_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_ses_user_date ON public.study_engine_snapshots(user_id, created_at DESC);

-- ========== BLOCO 7: tutor_sessions ==========
CREATE TABLE IF NOT EXISTS public.tutor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'livre',
  source_context text,
  specialty text,
  topic text,
  subtopic text,
  current_phase text DEFAULT 'inicio',
  mission_id uuid,
  conversation_id uuid REFERENCES public.chat_conversations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tutor sessions" ON public.tutor_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_ts_user ON public.tutor_sessions(user_id);

-- ========== tutor_messages ==========
CREATE TABLE IF NOT EXISTS public.tutor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_session_id uuid NOT NULL REFERENCES public.tutor_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  input_context_json jsonb,
  model_used text,
  tokens_used int,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tutor messages" ON public.tutor_messages FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_tm_session ON public.tutor_messages(tutor_session_id);

-- ========== tutor_context_snapshots ==========
CREATE TABLE IF NOT EXISTS public.tutor_context_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid,
  main_error text,
  current_goal text,
  pending_reviews int DEFAULT 0,
  accuracy numeric DEFAULT 0,
  phase text,
  exam_focus text,
  context_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tutor_context_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own tutor context" ON public.tutor_context_snapshots FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Service role manages tutor context" ON public.tutor_context_snapshots FOR ALL USING (true) WITH CHECK (true);

-- ========== BLOCO 8: ai_routing_decisions ==========
CREATE TABLE IF NOT EXISTS public.ai_routing_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  task_type text,
  complexity_score numeric DEFAULT 0,
  chosen_strategy text,
  chosen_model text,
  used_cache boolean DEFAULT false,
  sent_to_queue boolean DEFAULT false,
  latency_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_routing_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read routing decisions" ON public.ai_routing_decisions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages routing" ON public.ai_routing_decisions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_ard_module ON public.ai_routing_decisions(module);
CREATE INDEX idx_ard_created ON public.ai_routing_decisions(created_at DESC);

-- ========== ai_generated_assets ==========
CREATE TABLE IF NOT EXISTS public.ai_generated_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  specialty text,
  topic text,
  subtopic text,
  banca text,
  difficulty int DEFAULT 3,
  asset_type text NOT NULL DEFAULT 'question',
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_generation_mode text DEFAULT 'on_demand',
  quality_score numeric DEFAULT 0,
  review_status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_generated_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage generated assets" ON public.ai_generated_assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages assets" ON public.ai_generated_assets FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_aga_type ON public.ai_generated_assets(asset_type);
CREATE INDEX idx_aga_specialty ON public.ai_generated_assets(specialty);

-- ========== BLOCO 9: queue_jobs ==========
CREATE TABLE IF NOT EXISTS public.queue_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  user_id uuid,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority int NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  result_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.queue_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read queue jobs" ON public.queue_jobs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages queue" ON public.queue_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_qj_status ON public.queue_jobs(status, scheduled_for);
CREATE INDEX idx_qj_type ON public.queue_jobs(job_type);
CREATE INDEX idx_qj_user ON public.queue_jobs(user_id);

-- ========== worker_runs ==========
CREATE TABLE IF NOT EXISTS public.worker_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_name text NOT NULL,
  job_id uuid REFERENCES public.queue_jobs(id),
  status text NOT NULL DEFAULT 'running',
  duration_ms int,
  error_message text,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.worker_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read worker runs" ON public.worker_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages workers" ON public.worker_runs FOR ALL USING (true) WITH CHECK (true);

-- ========== BLOCO 11: lessons ==========
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty text NOT NULL,
  topic text,
  subtopic text,
  professor_name text,
  title text NOT NULL,
  lesson_type text NOT NULL DEFAULT 'audio',
  duration_seconds int DEFAULT 0,
  audio_url text,
  transcript text,
  summary_short text,
  summary_medium text,
  summary_long text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manages lessons" ON public.lessons FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_lessons_specialty ON public.lessons(specialty);

-- ========== lesson_segments ==========
CREATE TABLE IF NOT EXISTS public.lesson_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  ordem int NOT NULL DEFAULT 0,
  title text,
  start_second int DEFAULT 0,
  end_second int DEFAULT 0,
  transcript_segment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read segments" ON public.lesson_segments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manages segments" ON public.lesson_segments FOR ALL USING (true) WITH CHECK (true);

-- ========== lesson_progress ==========
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  current_second int DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lesson progress" ON public.lesson_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========== lesson_doubts ==========
CREATE TABLE IF NOT EXISTS public.lesson_doubts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  segment_id uuid REFERENCES public.lesson_segments(id),
  doubt_text text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_doubts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own doubts" ON public.lesson_doubts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========== BLOCO 12: chance_by_exam ==========
CREATE TABLE IF NOT EXISTS public.chance_by_exam (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  banca text NOT NULL,
  chance_score numeric NOT NULL DEFAULT 0,
  factors_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, banca)
);
ALTER TABLE public.chance_by_exam ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own chance" ON public.chance_by_exam FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Service role manages chance" ON public.chance_by_exam FOR ALL USING (true) WITH CHECK (true);

-- ========== BLOCO 13: recovery_runs ==========
CREATE TABLE IF NOT EXISTS public.recovery_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'recovery',
  phase int NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  reason text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recovery_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own recovery" ON public.recovery_runs FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Service role manages recovery" ON public.recovery_runs FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_rr_user_active ON public.recovery_runs(user_id, active);

-- ========== recovery_events ==========
CREATE TABLE IF NOT EXISTS public.recovery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_run_id uuid NOT NULL REFERENCES public.recovery_runs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text,
  payload_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recovery_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own recovery events" ON public.recovery_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recovery_runs r WHERE r.id = recovery_run_id AND r.user_id = auth.uid()));
CREATE POLICY "Service role manages recovery events" ON public.recovery_events FOR ALL USING (true) WITH CHECK (true);

-- ========== ÍNDICES EM TABELAS EXISTENTES ==========

-- questions_bank
CREATE INDEX IF NOT EXISTS idx_qb_topic ON public.questions_bank(topic);
CREATE INDEX IF NOT EXISTS idx_qb_subtopic ON public.questions_bank(subtopic);
CREATE INDEX IF NOT EXISTS idx_qb_review_status ON public.questions_bank(review_status);
CREATE INDEX IF NOT EXISTS idx_qb_difficulty ON public.questions_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_qb_source ON public.questions_bank(source);

-- questions_bank: coluna language
ALTER TABLE public.questions_bank ADD COLUMN IF NOT EXISTS language text DEFAULT 'pt-BR';

-- fsrs_cards
CREATE INDEX IF NOT EXISTS idx_fsrs_user_due ON public.fsrs_cards(user_id, due);
CREATE INDEX IF NOT EXISTS idx_fsrs_type ON public.fsrs_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_fsrs_state ON public.fsrs_cards(state);

-- practice_attempts
CREATE INDEX IF NOT EXISTS idx_pa_user ON public.practice_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_pa_question ON public.practice_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_pa_created ON public.practice_attempts(created_at DESC);

-- daily_plans
CREATE INDEX IF NOT EXISTS idx_dp_user_date ON public.daily_plans(user_id, plan_date DESC);

-- approval_scores
CREATE INDEX IF NOT EXISTS idx_as_user ON public.approval_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_as_created ON public.approval_scores(created_at DESC);

-- ai_content_cache
CREATE INDEX IF NOT EXISTS idx_acc_key_type ON public.ai_content_cache(cache_key, content_type);
CREATE INDEX IF NOT EXISTS idx_acc_expires ON public.ai_content_cache(expires_at);

-- ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_aul_user ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_aul_func ON public.ai_usage_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_aul_created ON public.ai_usage_logs(created_at DESC);

-- error_bank
CREATE INDEX IF NOT EXISTS idx_eb_user ON public.error_bank(user_id);
CREATE INDEX IF NOT EXISTS idx_eb_tema ON public.error_bank(tema);
CREATE INDEX IF NOT EXISTS idx_eb_dominado ON public.error_bank(dominado);

-- revisoes
CREATE INDEX IF NOT EXISTS idx_rev_user_status ON public.revisoes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_rev_data ON public.revisoes(data_revisao);

-- user_topic_profiles
CREATE INDEX IF NOT EXISTS idx_utp_user ON public.user_topic_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_utp_topic ON public.user_topic_profiles(topic);
CREATE INDEX IF NOT EXISTS idx_utp_next_review ON public.user_topic_profiles(next_review_at);

-- Colunas extras em daily_plans para Study Engine
ALTER TABLE public.daily_plans ADD COLUMN IF NOT EXISTS prep_index numeric DEFAULT 0;
ALTER TABLE public.daily_plans ADD COLUMN IF NOT EXISTS approval_score numeric DEFAULT 0;
ALTER TABLE public.daily_plans ADD COLUMN IF NOT EXISTS phase text DEFAULT 'construcao';
ALTER TABLE public.daily_plans ADD COLUMN IF NOT EXISTS recovery_mode boolean DEFAULT false;
ALTER TABLE public.daily_plans ADD COLUMN IF NOT EXISTS chance_score numeric DEFAULT 0;
ALTER TABLE public.daily_plans ADD COLUMN IF NOT EXISTS objective text;

-- Colunas extras em profiles para study_mode
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS study_mode text DEFAULT 'adaptativo';

-- Trigger updated_at para novas tabelas
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_settings','daily_plan_tasks','tutor_sessions',
    'ai_generated_assets','queue_jobs','lessons',
    'lesson_progress','chance_by_exam','recovery_runs'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();',
      t, t
    );
  END LOOP;
END $$;
