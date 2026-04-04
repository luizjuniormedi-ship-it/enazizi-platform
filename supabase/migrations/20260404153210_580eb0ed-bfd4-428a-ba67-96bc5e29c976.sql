
-- Enum para tipos de erro QA
CREATE TYPE public.qa_error_type AS ENUM (
  'IA_QUALIDADE', 'IA_JSON_INVALIDO', 'IA_RESPOSTA_EM_INGLES',
  'ENUNCIADO_CURTO', 'ALTERNATIVA_FRACA',
  'CACHE_VAZIO', 'CACHE_NAO_POPULADO',
  'AUTH_401', 'AUTH_TOKEN_AUSENTE',
  'EDGE_TIMEOUT', 'EDGE_FALHA_INTERNA',
  'DADOS_INCONSISTENTES', 'DADOS_ORFAOS',
  'RLS_NEGANDO_ACESSO', 'LOG_NAO_REGISTRADO',
  'MISSAO_INCOERENTE', 'TUTOR_GENERICO',
  'PROGRESSO_NAO_ATUALIZA', 'CTA_SEM_ACAO', 'PERFORMANCE_BAIXA'
);

CREATE TYPE public.qa_severity AS ENUM ('critico', 'alto', 'medio', 'baixo');

CREATE TYPE public.qa_fix_status AS ENUM (
  'detectado', 'corrigido_automaticamente', 'corrigido_com_retry',
  'corrigido_parcialmente', 'falha_persistente', 'escalado'
);

-- Tabela principal de eventos QA
CREATE TABLE public.qa_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type qa_error_type NOT NULL,
  module TEXT NOT NULL,
  severity qa_severity NOT NULL DEFAULT 'medio',
  status qa_fix_status NOT NULL DEFAULT 'detectado',
  causa_provavel TEXT,
  impacto TEXT,
  payload JSONB,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  run_id UUID
);

ALTER TABLE public.qa_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage qa_events" ON public.qa_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Tabela de correções automáticas
CREATE TABLE public.qa_auto_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.qa_events(id) ON DELETE CASCADE NOT NULL,
  action_taken TEXT NOT NULL,
  result_before JSONB,
  result_after JSONB,
  success BOOLEAN NOT NULL DEFAULT false,
  duration_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qa_auto_fixes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage qa_auto_fixes" ON public.qa_auto_fixes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Tabela de escalações
CREATE TABLE public.qa_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.qa_events(id) ON DELETE CASCADE NOT NULL,
  report TEXT NOT NULL,
  hypothesis_primary TEXT,
  hypothesis_secondary TEXT,
  recommended_action TEXT,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qa_escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage qa_escalations" ON public.qa_escalations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Índices para consultas rápidas
CREATE INDEX idx_qa_events_status ON public.qa_events(status);
CREATE INDEX idx_qa_events_error_type ON public.qa_events(error_type);
CREATE INDEX idx_qa_events_created ON public.qa_events(created_at DESC);
CREATE INDEX idx_qa_auto_fixes_event ON public.qa_auto_fixes(event_id);
CREATE INDEX idx_qa_escalations_event ON public.qa_escalations(event_id);
