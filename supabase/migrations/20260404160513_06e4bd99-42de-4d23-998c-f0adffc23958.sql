
-- =====================================================
-- daily_plans: colunas de recuperação pesada e diagnóstico
-- =====================================================
ALTER TABLE public.daily_plans
  ADD COLUMN IF NOT EXISTS diagnosis_summary text,
  ADD COLUMN IF NOT EXISTS heavy_recovery_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS heavy_recovery_phase integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_lock boolean DEFAULT false;

-- =====================================================
-- revisoes: ligação FSRS + updated_at
-- =====================================================
ALTER TABLE public.revisoes
  ADD COLUMN IF NOT EXISTS fsrs_card_id uuid REFERENCES public.fsrs_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_revisoes_fsrs_card ON public.revisoes(fsrs_card_id) WHERE fsrs_card_id IS NOT NULL;

CREATE TRIGGER set_revisoes_updated_at
  BEFORE UPDATE ON public.revisoes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =====================================================
-- approval_scores: colunas complementares + updated_at
-- =====================================================
ALTER TABLE public.approval_scores
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS prep_index numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phase text,
  ADD COLUMN IF NOT EXISTS chance_score numeric DEFAULT 0;

-- Constraint: score entre 0 e 100 via trigger
CREATE OR REPLACE FUNCTION public.clamp_approval_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.score := GREATEST(0, LEAST(100, NEW.score));
  IF NEW.prep_index IS NOT NULL THEN
    NEW.prep_index := GREATEST(0, LEAST(100, NEW.prep_index));
  END IF;
  IF NEW.chance_score IS NOT NULL THEN
    NEW.chance_score := GREATEST(0, LEAST(100, NEW.chance_score));
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER clamp_approval_scores_trigger
  BEFORE INSERT OR UPDATE ON public.approval_scores
  FOR EACH ROW EXECUTE FUNCTION public.clamp_approval_score();

-- =====================================================
-- Índices complementares faltantes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tutor_ctx_user ON public.tutor_context_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_events_run ON public.recovery_events(recovery_run_id);
CREATE INDEX IF NOT EXISTS idx_fsrs_review_log_date ON public.fsrs_review_log(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_mode ON public.tutor_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_daily_plan_tasks_completed ON public.daily_plan_tasks(user_id, completed);
