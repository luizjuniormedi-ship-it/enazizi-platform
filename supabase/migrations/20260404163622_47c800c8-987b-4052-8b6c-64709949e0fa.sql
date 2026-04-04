
-- =====================================================
-- ÍNDICES DE PERFORMANCE — questions_bank e error_bank
-- =====================================================

-- 1. questions_bank(review_status, topic)
-- Motivo: queries frequentes filtram questões por status de revisão
-- e tema (ex: buscar questões aprovadas de Cardiologia).
CREATE INDEX IF NOT EXISTS idx_qb_review_status_topic
  ON public.questions_bank (review_status, topic);

-- 2. error_bank(user_id, tema)
-- Motivo: o módulo de erros consulta erros do aluno agrupados por tema
-- para gerar recomendações e recovery mode.
CREATE INDEX IF NOT EXISTS idx_eb_user_tema
  ON public.error_bank (user_id, tema);
