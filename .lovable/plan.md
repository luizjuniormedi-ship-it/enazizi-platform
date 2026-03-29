

# Reset Completo — Perfil + Dados de Estudo

## Objetivo
Resetar TUDO para todos os usuários: perfil, onboarding E dados de estudo. Todos começam do zero absoluto.

## Migração SQL única

Limpar dados de todas as tabelas de estudo/progresso, e resetar perfil:

```sql
-- Dados de estudo
DELETE FROM study_performance;
DELETE FROM study_plans;
DELETE FROM study_tasks;
DELETE FROM enazizi_progress;
DELETE FROM practice_attempts;
DELETE FROM desempenho_questoes;
DELETE FROM temas_estudados;
DELETE FROM revisoes;
DELETE FROM error_bank;
DELETE FROM user_topic_profiles;
DELETE FROM approval_scores;
DELETE FROM performance_predictions;

-- FSRS
DELETE FROM fsrs_review_log;
DELETE FROM fsrs_cards;

-- Gamificação
DELETE FROM user_gamification;
DELETE FROM user_achievements;

-- Simulados e clínicos (resultados do aluno)
DELETE FROM teacher_simulado_results;
DELETE FROM teacher_clinical_case_results;
DELETE FROM teacher_study_assignment_results;
DELETE FROM discursive_attempts;

-- Chat e AI
DELETE FROM chat_messages;
DELETE FROM chat_conversations;
DELETE FROM ai_usage_logs;

-- Quotas (serão recriadas)
DELETE FROM user_quotas;

-- Perfil — resetar campos
UPDATE profiles SET
  onboarding_version = 1,
  last_onboarding_step = 0,
  experience_reset_at = NULL,
  display_name = NULL,
  phone = NULL,
  periodo = NULL,
  faculdade = NULL,
  has_completed_diagnostic = false,
  target_specialty = NULL,
  exam_date = NULL,
  daily_study_hours = 4;

-- Recriar gamificação e quotas para cada usuário
INSERT INTO user_gamification (user_id)
SELECT user_id FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO user_quotas (user_id)
SELECT user_id FROM profiles
ON CONFLICT DO NOTHING;
```

## Limpar localStorage

Adicionar ~5 linhas no `ProtectedRoute.tsx` com check de versão para limpar flags do localStorage automaticamente.

## Fluxo resultante
1. Login → Tela "Complete seu cadastro" (nome, telefone, período, faculdade)
2. → WelcomeBackScreen → OnboardingV2Flow (6 etapas)
3. → Dashboard (tudo zerado: XP 0, streak 0, sem histórico)

## O que NÃO muda
- Autenticação (email/senha continuam)
- Estrutura das tabelas
- Conteúdo global (questões, cenários clínicos, provas)
- Uploads globais
- Configurações de admin

## Arquivos alterados
1. **Nova migração SQL** — DELETE + UPDATE em ~20 tabelas
2. **`src/components/auth/ProtectedRoute.tsx`** — Check de versão no localStorage

