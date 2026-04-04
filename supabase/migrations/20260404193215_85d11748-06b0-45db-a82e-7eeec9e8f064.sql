
-- Tabela de feature flags
CREATE TABLE public.system_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text UNIQUE NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  category text DEFAULT 'general',
  rollout_mode text NOT NULL DEFAULT 'global' CHECK (rollout_mode IN ('global', 'admins_only', 'beta_only')),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_flags_key ON public.system_flags (flag_key);

ALTER TABLE public.system_flags ENABLE ROW LEVEL SECURITY;

-- Leitura para todos autenticados
CREATE POLICY "Authenticated users can read flags"
  ON public.system_flags FOR SELECT TO authenticated USING (true);

-- Escrita apenas admin
CREATE POLICY "Admins can manage flags"
  ON public.system_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela de auditoria
CREATE TABLE public.system_flag_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL,
  previous_value boolean,
  new_value boolean NOT NULL,
  changed_by uuid,
  reason text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_flag_audit_key ON public.system_flag_audit (flag_key);
CREATE INDEX idx_system_flag_audit_time ON public.system_flag_audit (changed_at DESC);

ALTER TABLE public.system_flag_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit"
  ON public.system_flag_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit"
  ON public.system_flag_audit FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger automático de updated_at
CREATE TRIGGER set_system_flags_updated_at
  BEFORE UPDATE ON public.system_flags
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Flags iniciais
INSERT INTO public.system_flags (flag_key, enabled, description, category, rollout_mode) VALUES
  ('new_planner_enabled', true, 'Planner Estratégico Inteligente (v2)', 'planner', 'global'),
  ('new_tutor_flow_enabled', true, 'Dual-write e fluxo novo do Tutor IA', 'tutor', 'global'),
  ('new_dashboard_snapshot_enabled', true, 'Dashboard snapshot-first com fallback', 'dashboard', 'global'),
  ('new_recovery_enabled', true, 'Recovery Mode persistido em banco', 'recovery', 'global'),
  ('new_fsrs_flow_enabled', true, 'Fluxo FSRS consolidado', 'fsrs', 'global'),
  ('new_chance_by_exam_enabled', true, 'Chance de aprovação por banca', 'approval', 'global');
