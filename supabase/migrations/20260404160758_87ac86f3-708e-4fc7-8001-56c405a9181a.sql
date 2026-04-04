
-- =====================================================
-- 1. qa_findings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.qa_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qa_run_id uuid REFERENCES public.qa_runs(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'medium',
  module text NOT NULL,
  finding_type text NOT NULL,
  description text,
  probable_cause text,
  status text NOT NULL DEFAULT 'detectado',
  affected_records integer DEFAULT 0,
  evidence_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qa_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view qa_findings"
  ON public.qa_findings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages qa_findings"
  ON public.qa_findings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_qf_run ON public.qa_findings(qa_run_id);
CREATE INDEX idx_qf_severity ON public.qa_findings(severity);
CREATE INDEX idx_qf_status ON public.qa_findings(status);
CREATE INDEX idx_qf_module ON public.qa_findings(module);
CREATE INDEX idx_qf_created ON public.qa_findings(created_at DESC);

CREATE TRIGGER set_qa_findings_updated_at
  BEFORE UPDATE ON public.qa_findings
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =====================================================
-- 2. qa_revalidations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.qa_revalidations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id uuid NOT NULL REFERENCES public.qa_findings(id) ON DELETE CASCADE,
  fix_id uuid REFERENCES public.qa_auto_fixes(id) ON DELETE SET NULL,
  passed boolean NOT NULL DEFAULT false,
  details text,
  revalidated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qa_revalidations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view qa_revalidations"
  ON public.qa_revalidations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages qa_revalidations"
  ON public.qa_revalidations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_qrev_finding ON public.qa_revalidations(finding_id);
CREATE INDEX idx_qrev_passed ON public.qa_revalidations(passed);

-- =====================================================
-- 3. dashboard_snapshots — colunas de estado do aluno
-- =====================================================
ALTER TABLE public.dashboard_snapshots
  ADD COLUMN IF NOT EXISTS mission_id uuid,
  ADD COLUMN IF NOT EXISTS prep_index numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approval_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_reviews integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chance_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weak_points_json jsonb,
  ADD COLUMN IF NOT EXISTS current_objective text;

-- =====================================================
-- 4. Link qa_auto_fixes and qa_escalations to qa_findings
-- =====================================================
ALTER TABLE public.qa_auto_fixes
  ADD COLUMN IF NOT EXISTS finding_id uuid REFERENCES public.qa_findings(id) ON DELETE SET NULL;

ALTER TABLE public.qa_escalations
  ADD COLUMN IF NOT EXISTS finding_id uuid REFERENCES public.qa_findings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'aberto';

CREATE INDEX IF NOT EXISTS idx_qa_fixes_finding ON public.qa_auto_fixes(finding_id) WHERE finding_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qa_esc_finding ON public.qa_escalations(finding_id) WHERE finding_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qa_esc_status ON public.qa_escalations(status);
