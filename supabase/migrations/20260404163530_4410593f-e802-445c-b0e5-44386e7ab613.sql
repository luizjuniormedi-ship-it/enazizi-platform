
-- =====================================================
-- CORREÇÃO DE POLICIES RLS — roles {public} → service_role
-- Tabelas: ai_generated_assets, curriculum_specialties,
--          curriculum_topics, curriculum_subtopics,
--          curriculum_weights, curriculum_prerequisites
-- =====================================================

-- 1. ai_generated_assets
-- Remover policy insegura com role public
DROP POLICY IF EXISTS "Service role manages assets" ON public.ai_generated_assets;
-- Recriar restrita a service_role
CREATE POLICY "Service role manages assets"
  ON public.ai_generated_assets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 2. curriculum_specialties
DROP POLICY IF EXISTS "Service manages specialties" ON public.curriculum_specialties;
CREATE POLICY "Service role manages specialties"
  ON public.curriculum_specialties FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3. curriculum_topics
DROP POLICY IF EXISTS "Service manages topics" ON public.curriculum_topics;
CREATE POLICY "Service role manages topics"
  ON public.curriculum_topics FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 4. curriculum_subtopics
DROP POLICY IF EXISTS "Service manages subtopics" ON public.curriculum_subtopics;
CREATE POLICY "Service role manages subtopics"
  ON public.curriculum_subtopics FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 5. curriculum_weights
DROP POLICY IF EXISTS "Service manages weights" ON public.curriculum_weights;
CREATE POLICY "Service role manages weights"
  ON public.curriculum_weights FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 6. curriculum_prerequisites
DROP POLICY IF EXISTS "Service manages prereqs" ON public.curriculum_prerequisites;
CREATE POLICY "Service role manages prereqs"
  ON public.curriculum_prerequisites FOR ALL TO service_role
  USING (true) WITH CHECK (true);
