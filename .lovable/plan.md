
## MAPA DE DEPENDÊNCIAS ATUAL

### Tabelas ativamente usadas pelo Frontend (reads + writes):

| Módulo | Tabelas | Hooks/Arquivos |
|--------|---------|----------------|
| **Dashboard Core** | profiles, practice_attempts, revisoes, exam_sessions, anamnesis_results, temas_estudados, simulation_sessions, chronicle_osce_sessions, user_gamification, error_bank, approval_scores, medical_domain_map | useCoreData, useDashboardData |
| **Dashboard Cards** | flashcards, uploads, study_tasks, study_plans, reviews, discursive_attempts, questions_bank, summaries, chat_conversations, medical_image_attempts, diagnostic_results, teacher_simulado_results | useDashboardData |
| **Weekly/Streak** | practice_attempts, reviews, error_bank, exam_sessions, simulation_history, user_gamification, medical_domain_map | WeeklyProgressCard, StreakCalendar |
| **Study Engine** | medical_domain_map, fsrs_cards, revisoes, curriculum_matrix, daily_plans | studyEngine.ts |
| **Missão/DailyPlan** | daily_plans, daily_plan_tasks, revisoes, temas_estudados | DailyPlan.tsx |
| **Tutor** | chat_conversations, chat_messages, study_performance, medical_domain_map, enazizi_progress | useChatMessages, useTutorPerformance, useChatProgress |
| **FSRS** | fsrs_cards, fsrs_review_log | useFsrs |
| **Cronograma** | temas_estudados, revisoes, desempenho_questoes, cronograma_config, study_plans, study_tasks, uploads | SmartPlanner, StudyPlanContent |
| **Simulados** | exam_sessions (via edge functions) | ExamSimulator |
| **Error Bank** | error_bank | errorBankLogger |
| **Domain Map** | medical_domain_map | updateDomainMap |
| **Performance** | study_performance, performance_report | PerformanceReport |
| **Auth/Roles** | user_roles, profiles | useUserRoles, useAuth |

### Tabelas NOVAS (criadas nas 4 sprints) que já existem mas NÃO são lidas pelo frontend:
- curriculum_topics, curriculum_subtopics, curriculum_weights, curriculum_prerequisites
- question_topic_map
- tutor_sessions, tutor_messages, tutor_context_snapshots
- study_engine_snapshots
- qa_runs, qa_findings, qa_auto_fixes, qa_escalations, qa_revalidations, qa_events, qa_test_runs, qa_test_results
- queue_jobs, queue_results, worker_runs
- recovery_events, recovery_runs
- user_topic_profiles, performance_by_topic
- user_settings

---

## DIAGNÓSTICO

A boa notícia: **a estrutura nova já existe em paralelo**. A migração NÃO precisa criar tabelas — precisa apenas:

1. **Conectar o frontend às novas tabelas** (leitura)
2. **Adicionar escrita nas novas tabelas** (dual-write)
3. **Enriquecer dados existentes** com FK para currículo
4. **Manter fallback legado** até validação completa

---

## PLANO DE EXECUÇÃO (5 blocos)

### Bloco A — Compatibilidade Curricular (baixo risco)
- Fazer o Study Engine consultar `curriculum_topics/subtopics/weights` ao invés de `curriculum_matrix` estático
- Manter `curriculum_matrix` como fallback

### Bloco B — Dual-write Performance (médio risco)
- `useTutorPerformance` → gravar também em `performance_by_topic` e `user_topic_profiles`
- `updateDomainMap` → gravar também em `performance_by_topic`
- Manter `medical_domain_map` e `study_performance` intactos

### Bloco C — Study Engine Snapshots (baixo risco)
- Após cada execução do Study Engine, salvar snapshot em `study_engine_snapshots`
- Dashboard snapshot → `dashboard_snapshots` (já existe)

### Bloco D — Tutor Contextual (médio risco)
- Criar `tutor_sessions` ao iniciar conversa no tutor
- Gravar `tutor_messages` em paralelo com `chat_messages`
- Popular `tutor_context_snapshots` com contexto da sessão

### Bloco E — QA + Fila (baixo risco, backend only)
- Edge function `qa-autocorrect` já usa as novas tabelas
- Nenhuma mudança de frontend necessária

---

### O que NÃO muda nesta etapa:
- Nenhuma tabela existente é removida
- Nenhuma coluna existente é alterada
- Nenhum fluxo de UI é quebrado
- Dados existentes são preservados intactos

Devo prosseguir com a implementação do **Bloco A** (Study Engine usando currículo normalizado)?
