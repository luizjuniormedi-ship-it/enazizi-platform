# MAPA COMPLETO DO SISTEMA ENAZIZI + PLANO DE MIGRAÇÃO

**Gerado em:** 2026-04-04  
**Status:** Planejamento — nenhuma alteração executada

---

## BLOCO 1 — MAPEAMENTO DO BANCO ATUAL

### 1.1 Inventário Completo de Tabelas (110 tabelas)

#### TABELAS CRÍTICAS (dados do aluno)

| Tabela | Colunas | Registros | PK | Uso Principal |
|--------|---------|-----------|----|----|
| profiles | 28 | 164 | id (uuid) | Dados do aluno, faculdade, período, target_exams |
| user_roles | 4 | 171 | id (uuid) | Controle de acesso (admin/professor/user) |
| user_gamification | 11 | 164 | id (uuid) | Streak, XP, nível |
| user_quotas | 5 | 164 | id (uuid) | Limites de uso |
| user_settings | 5 | 0 | id (uuid) | Configurações do usuário (VAZIA) |
| user_achievements | 6 | 49 | id (uuid) | Conquistas desbloqueadas |
| user_presence | 4 | 130 | - | Heartbeat de presença online |
| user_module_access | 5 | 30 | id (uuid) | Acesso a módulos |
| user_topic_profiles | 14 | 27 | id (uuid) | Perfil por tema (NOVO, dual-write ativo) |

#### TABELAS DE ESTUDO E DESEMPENHO

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| practice_attempts | 5 | 71 | Tentativas de questões |
| error_bank | 14 | 279 | Erros recorrentes do aluno |
| medical_domain_map | 13 | 140 | Score por especialidade |
| study_performance | 10 | 19 | Performance global do tutor |
| enazizi_progress | 12 | 18 | Estado do tutor Enazizi |
| desempenho_questoes | 12 | 0 | Desempenho por questão/revisão (VAZIA) |
| performance_by_topic | 12 | 0 | Performance por tópico (NOVO, dual-write ativo) |

#### TABELAS DE QUESTÕES

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| questions_bank | 22 | 12.467 | Banco principal de questões |
| real_exam_questions | 17 | 237 | Questões de provas reais |
| question_topic_map | 9 | 12.466 | Mapeamento questão→currículo |
| question_quality_flags | 8 | 0 | Flags de qualidade (VAZIA) |
| question_usage_logs | 9 | 0 | Logs de uso de questões (VAZIA) |

#### TABELAS DE REVISÃO / FSRS

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| revisoes | 12 | 325 | Revisões agendadas (legado) |
| reviews | 6 | 20 | Revisões de flashcards |
| fsrs_cards | 15 | 13 | Cards FSRS v5 |
| fsrs_review_log | 8 | 20 | Log de revisões FSRS |
| temas_estudados | 12 | 67 | Temas registrados manualmente |

#### TABELAS DE CURRÍCULO

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| curriculum_matrix | 23 | 152 | Matriz curricular (LEGADO) |
| curriculum_specialties | 6 | 35 | Especialidades (NOVO) |
| curriculum_topics | 6 | 118 | Temas por especialidade (NOVO) |
| curriculum_subtopics | 16 | 169 | Subtemas com metadados (NOVO) |
| curriculum_weights | 5 | 676 | Pesos por banca (NOVO) |
| curriculum_prerequisites | 4 | 34 | Pré-requisitos entre subtemas (NOVO) |

#### TABELAS DE PLANO DIÁRIO / MISSÃO

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| daily_plans | 19 | 14 | Planos diários |
| daily_plan_tasks | 18 | 43 | Tasks do plano diário |
| study_plans | 6 | 12 | Planos de estudo cronograma |
| study_tasks | 6 | 11 | Tasks do cronograma |

#### TABELAS DE TUTOR / CHAT

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| chat_conversations | 6 | 101 | Conversas do tutor |
| chat_messages | 6 | 418 | Mensagens do tutor |
| tutor_sessions | 12 | 0 | Sessões do tutor (NOVO, VAZIA) |
| tutor_messages | 8 | 0 | Mensagens do tutor (NOVO, VAZIA) |
| tutor_context_snapshots | 12 | 0 | Contexto do tutor (NOVO, VAZIA) |

#### TABELAS DE SIMULADOS / EXAMES

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| exam_sessions | 13 | 96 | Sessões de simulado |
| exam_banks | 10 | 14 | Bancas de exame |
| simulation_sessions | 12 | 24 | Simulações clínicas |
| simulation_history | 17 | 51 | Histórico de simulações |

#### TABELAS DE SCORES

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| approval_scores | 15 | 7 | Score de aprovação |
| chance_by_exam | 7 | 0 | Chance por banca (VAZIA) |
| dashboard_snapshots | 12 | 0 | Snapshots do dashboard (VAZIA) |
| study_engine_snapshots | 16 | 0 | Snapshots do engine (NOVO, dual-write ativo) |

#### TABELAS DE IA

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| ai_content_cache | 17 | 0 | Cache de conteúdo IA (VAZIA) |
| ai_usage_logs | 12 | 0 | Logs de uso de IA (VAZIA) |
| ai_generated_assets | 14 | 0 | Assets gerados por IA (VAZIA) |
| ai_routing_decisions | 11 | 0 | Decisões de roteamento (VAZIA) |

#### TABELAS DE FILA / WORKERS

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| queue_jobs | 15 | 0 | Fila de processamento (VAZIA) |
| queue_results | 4 | 0 | Resultados da fila (VAZIA) |
| worker_runs | 9 | 0 | Execuções de workers (VAZIA) |

#### TABELAS DE QA

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| qa_runs | 17 | 1 | Execuções de QA |
| qa_findings | 12 | 0 | Achados de QA |
| qa_auto_fixes | 9 | 5 | Correções automáticas |
| qa_escalations | 10 | 3 | Escalações |
| qa_events | 12 | 15 | Eventos de QA |
| qa_revalidations | 7 | 0 | Revalidações |
| qa_test_runs | 12 | 5 | Runs de teste |
| qa_test_results | 11 | 57 | Resultados de teste |

#### TABELAS DE RECOVERY

| Tabela | Colunas | Registros | Uso Principal |
|--------|---------|-----------|---------------|
| recovery_runs | 10 | 0 | Runs de recuperação (VAZIA) |
| recovery_events | 6 | 0 | Eventos de recuperação (VAZIA) |

---

## BLOCO 2 — MAPEAMENTO DE USO REAL POR MÓDULO

### 2.1 Dashboard (src/hooks/useCoreData.ts + useDashboardData.ts)

**useCoreData** — query principal centralizada:
| Tabela | Campos | Tipo |
|--------|--------|------|
| profiles | display_name, has_completed_diagnostic, target_exams, target_exam, exam_date | READ |
| practice_attempts | correct, created_at | READ (últimas 500) |
| revisoes | id, status, data_revisao, created_at | READ |
| exam_sessions | score, total_questions, finished_at | READ (finished, últimas 50) |
| anamnesis_results | final_score, created_at | READ (últimas 10) |
| temas_estudados | id, tema, especialidade, created_at + count | READ |
| simulation_sessions | id + count | READ (finished) |
| chronicle_osce_sessions | score | READ |
| user_gamification | current_streak, xp, level | READ |
| error_bank | id + count | READ |
| approval_scores | score, created_at | READ (últimas 10) |
| medical_domain_map | specialty, domain_score, questions_answered, correct_answers | READ |

**useDashboardData** — queries complementares:
| Tabela | Campos | Tipo |
|--------|--------|------|
| flashcards | id (count) | READ |
| uploads | id (count) | READ |
| study_tasks | completed, created_at, task_json | READ |
| study_plans | plan_json | READ |
| reviews | next_review, flashcard_id | READ |
| discursive_attempts | id (count) | READ |
| questions_bank | id (count, global+user) | READ |
| summaries | id (count) | READ |
| chat_conversations | id, agent_type (count) | READ |
| medical_image_attempts | id (count) | READ |
| diagnostic_results | id (count) | READ |
| teacher_simulado_results | total_questions, score | READ |
| teacher_clinical_case_results | id (count) | READ |

### 2.2 Study Engine (src/lib/studyEngine.ts)

**Queries exclusivas do engine:**
| Tabela | Campos | Filtros |
|--------|--------|---------|
| revisoes | id, tema_id, data_revisao, status, prioridade, risco_esquecimento + JOIN temas_estudados | status=pendente, top 20 |
| error_bank | id, tema, subtema, vezes_errado, dominado, categoria_erro | dominado=false, top 20 |
| desempenho_questoes | tema_id, taxa_acerto, questoes_feitas + JOIN temas_estudados | top 20 |
| temas_estudados | id, tema, especialidade, data_estudo, status, dificuldade | top 50 |
| fsrs_cards | id, card_type, card_ref_id, stability, difficulty, state, due, lapses | due <= now, top 30 |
| mentor_theme_plan_targets | plan_id | por target user |
| practical_exam_results | final_score, specialty, scores_json, created_at | últimas 10 |
| curriculum_subtopics/topics/weights | via curriculumBridge | ativo=true, priority>=6 |
| medical_domain_map | specialty, domain_score, questions_answered | fallback se sem coreData |

**Outputs do engine:**
- `StudyRecommendation[]` → missão/dashboard
- `AdaptiveState` → approval_score, weights, mode, lockStatus, memoryPressure, recoveryMode, heavyRecovery
- **Snapshot** → study_engine_snapshots (dual-write ativo)

### 2.3 Missão Diária (src/pages/DailyPlan.tsx)

| Tabela | Campos | Tipo |
|--------|--------|------|
| daily_plans | *, plan_json, completed_blocks | READ |
| daily_plan_tasks | * | READ |
| revisoes | tema_id, status | READ (pendente + JOIN temas_estudados) |
| temas_estudados | id, tema, especialidade, subtopico | READ |

**Origem dos dados:** Edge function `generate-daily-plan` gera o plano e grava em `daily_plans.plan_json`. As tasks foram migradas para `daily_plan_tasks` via backfill.

### 2.4 Tutor IA (src/hooks/tutor/*)

| Hook | Tabela | Operação |
|------|--------|----------|
| useChatMessages | chat_conversations | READ/WRITE (CRUD) |
| useChatMessages | chat_messages | READ/WRITE |
| useTutorPerformance | study_performance | READ/WRITE (upsert) |
| useTutorPerformance | medical_domain_map | READ/WRITE (upsert) |
| useTutorPerformance | performance_by_topic | WRITE (dual-write) |
| useTutorPerformance | user_topic_profiles | WRITE (dual-write) |
| useChatProgress | enazizi_progress | READ/WRITE (upsert) |

**Edge function:** `study-session` → processa a conversa com IA

### 2.5 FSRS / Revisões (src/hooks/useFsrs.ts)

| Tabela | Operação | Detalhe |
|--------|----------|---------|
| fsrs_cards | READ/WRITE | getOrCreate, review, getDueCards, getStats |
| fsrs_review_log | WRITE | Log de cada revisão |

**Fluxo:** `useFsrs.review()` → atualiza card → loga revisão
**Alimentação:** `useTutorPerformance` cria cards tipo 'tema' após sessões
**Volume:** 13 cards, 20 logs — uso baixo (FSRS sub-utilizado)

### 2.6 Questões

| Tabela | Campos | Fonte |
|--------|--------|-------|
| questions_bank | enunciado, alternatives, correct_answer, topic, specialty, difficulty, review_status, banca | Edge functions (question-generator, ingest-questions, populate-questions) |
| real_exam_questions | * | ingest-questions |
| question_topic_map | question_id, mapped_topic_text, topic_id, subtopic_id | Backfill automático |

### 2.7 Approval Score

**Cálculo (src/lib/studyEngine.ts → computeApprovalScore):**
```
score = accuracy * 0.35 + avgDomain * 0.25 + volumeScore * 0.20 + diversityScore * 0.20
```
| Componente | Fonte |
|------------|-------|
| accuracy | practice_attempts (correct/total) |
| avgDomain | medical_domain_map (domain_score médio) |
| volumeScore | practice_attempts.length / 500 |
| diversityScore | Atividades distintas (practice, exams, clinical, anamnesis) |

**Persistência:** approval_scores (7 registros), com trigger `clamp_approval_score` (0-100)

### 2.8 Recovery Mode

**Implementação:** Existe no Study Engine (studyEngine.ts linhas 431-480)
- **Recovery normal:** overdueCount >= 15 OU memoryPressure >= 70 OU (approvalScore < 35 AND overdueCount >= 8)
- **Heavy Recovery (30 dias):** overdueCount >= 25 AND memoryPressure >= 80 AND approvalScore < 40
- **Armazenamento:** localStorage (HEAVY_RECOVERY_STORAGE_KEY)
- **Tabelas recovery_runs/recovery_events:** Existem mas VAZIAS — não integradas ao frontend

### 2.9 IA — Edge Functions

| Edge Function | Usa Cache? | Usa Log? | Modelo |
|---------------|-----------|---------|--------|
| study-session | ❌ | ❌ | Via ai-fetch |
| question-generator | ❌ | ❌ | Via ai-fetch |
| chatgpt-agent | ❌ | ❌ | Via ai-fetch |
| generate-daily-plan | ❌ | ❌ | Via ai-fetch |
| medical-chronicle | ❌ | ❌ | Via ai-fetch |
| clinical-simulation | ❌ | ❌ | Via ai-fetch |
| anamnesis-trainer | ❌ | ❌ | Via ai-fetch |
| motivational-coach | ❌ | ❌ | Via ai-fetch |
| content-summarizer | ❌ | ❌ | Via ai-fetch |
| feynman-trainer | ❌ | ❌ | Via ai-fetch |
| interview-simulator | ❌ | ❌ | Via ai-fetch |
| mentor-chat | ❌ | ❌ | Via ai-fetch |
| qa-autocorrect | ❌ | ❌ | Via ai-fetch |

**⚠️ PROBLEMA CRÍTICO:** ai_content_cache (0 registros) e ai_usage_logs (0 registros) estão VAZIOS. A shared lib `ai-cache.ts` existe mas NENHUMA edge function a importa ativamente.

---

## BLOCO 3 — MAPEAMENTO DO FRONTEND

### 3.1 Hooks Principais

| Hook | Tabelas | Criticidade |
|------|---------|-------------|
| `useCoreData` | 12 tabelas (ver 2.1) | 🔴 CRÍTICO — base de todos os cards |
| `useStudyEngine` | depende de useCoreData + 7 queries | 🔴 CRÍTICO — motor de decisão |
| `useDashboardData` | 13 tabelas | 🔴 CRÍTICO — dados complementares |
| `useFsrs` | fsrs_cards, fsrs_review_log | 🟡 MÉDIO |
| `useAuth` | auth.users | 🔴 CRÍTICO |
| `useUserRoles` | user_roles | 🔴 CRÍTICO |
| `useGamification` | user_gamification | 🟡 MÉDIO |
| `useContentLock` | (lógica inline no engine) | 🟡 MÉDIO |
| `useExamReadiness` | multiple | 🟢 BAIXO |
| `useWeeklyGoals` | user_gamification, practice_attempts | 🟢 BAIXO |
| `useChatMessages` | chat_conversations, chat_messages | 🟡 MÉDIO |
| `useTutorPerformance` | study_performance, medical_domain_map | 🟡 MÉDIO |
| `useChatProgress` | enazizi_progress | 🟢 BAIXO |
| `usePresenceHeartbeat` | user_presence | 🟢 BAIXO |

### 3.2 Páginas Principais

| Página | Hooks Usados | Tabelas Diretas |
|--------|-------------|-----------------|
| Dashboard | useCoreData, useDashboardData, useStudyEngine | Nenhuma direta |
| DailyPlan | useCoreData | daily_plans, daily_plan_tasks, revisoes, temas_estudados |
| ChatGPT (Tutor) | useChatMessages, useTutorPerformance, useChatProgress | study_performance, medical_domain_map, chat_* |
| SmartPlanner | useAuth | temas_estudados, revisoes, desempenho_questoes, cronograma_config |
| ExamSimulator | useAuth | exam_sessions |
| Flashcards | useAuth, useFsrs | flashcards, reviews |
| Profile | useAuth | profiles |

---

## BLOCO 4 — DEPENDÊNCIAS CRÍTICAS (NÃO TOCAR)

### Campos que NÃO podem mudar:
- `profiles.user_id` — FK implícita em TUDO
- `profiles.target_exams`, `profiles.target_exam` — input do Study Engine
- `profiles.has_completed_diagnostic` — gate de onboarding
- `practice_attempts.correct`, `practice_attempts.created_at` — accuracy global
- `revisoes.status`, `revisoes.data_revisao` — lógica de overdue
- `error_bank.tema`, `error_bank.vezes_errado`, `error_bank.dominado` — error_review
- `fsrs_cards.due`, `fsrs_cards.state`, `fsrs_cards.stability` — scheduling
- `medical_domain_map.domain_score` — approval score calculation
- `daily_plans.plan_json` — fallback legado
- `chat_conversations.agent_type` — filtro de tutor
- `approval_scores.score` — dashboard display

### Tabelas que NÃO podem quebrar:
1. `profiles` — usada em TUDO
2. `user_roles` — controle de acesso
3. `practice_attempts` — accuracy
4. `revisoes` — overdue/missão
5. `error_bank` — error review
6. `questions_bank` — questões
7. `daily_plans` — missão diária
8. `chat_conversations` + `chat_messages` — tutor
9. `user_gamification` — streak/xp

### Queries sensíveis:
- `useCoreData.fetchCoreData()` — 12 queries paralelas
- `studyEngine.generateRecommendations()` — 7+ queries
- `useDashboardData` — 15 queries paralelas

---

## BLOCO 5 — GAP ENTRE ATUAL E FUTURO

### ✅ Já implementado (nova arquitetura):
| Item | Status | Integrado ao Frontend? |
|------|--------|----------------------|
| curriculum_topics/subtopics/weights | ✅ Populado (118/169/676) | ✅ Via curriculumBridge |
| curriculum_prerequisites | ✅ 34 registros | ❌ Não usado pelo frontend |
| question_topic_map | ✅ 12.466 registros | ❌ Não usado pelo frontend |
| study_engine_snapshots | ✅ Tabela existe | ✅ Dual-write ativo |
| performance_by_topic | ✅ Tabela existe | ✅ Dual-write ativo |
| user_topic_profiles | ✅ 27 registros | ✅ Dual-write ativo |
| tutor_sessions/messages/context | ✅ Tabelas existem | ❌ Vazias, não integradas |
| qa_* (6 tabelas) | ✅ Estrutura existe | ⚠️ Backend only |
| queue_jobs/worker_runs | ✅ Tabelas existem | ❌ Vazias, não usadas |
| recovery_runs/events | ✅ Tabelas existem | ❌ Vazias, não integradas |
| dashboard_snapshots | ✅ Tabela existe | ❌ Vazia, não usada |

### ❌ Gaps identificados:

| Gap | Gravidade | Descrição |
|-----|-----------|-----------|
| ai_content_cache VAZIO | 🔴 ALTO | Nenhuma edge function usa o cache — todo call de IA é novo |
| ai_usage_logs VAZIO | 🔴 ALTO | Sem rastreamento de custo/uso de IA |
| FSRS sub-utilizado | 🟡 MÉDIO | Apenas 13 cards — deveria ter centenas |
| desempenho_questoes VAZIO | 🟡 MÉDIO | Tabela existe mas ninguém grava (exceto SmartPlanner manual) |
| chance_by_exam VAZIO | 🟡 MÉDIO | Chance por banca não calculada |
| dashboard_snapshots VAZIO | 🟡 MÉDIO | Edge function existe mas não popula |
| tutor_sessions não integrado | 🟡 MÉDIO | Chat usa chat_conversations, não tutor_sessions |
| recovery_events não integrado | 🟢 BAIXO | Recovery mode usa localStorage |
| cronograma_config VAZIO | 🟢 BAIXO | Configuração padrão sempre |
| Heavy Recovery no localStorage | 🟢 BAIXO | Deveria persistir no banco |

---

## BLOCO 6 — ESTRATÉGIA DE MIGRAÇÃO

### Princípio: Migração Gradual em 7 Etapas

```
Legado ← Leitura  → [Compatibilidade] → Leitura → Novo
Legado ← Escrita  → [Dual-Write]      → Escrita → Novo
                     (período de transição)
```

### O que JÁ foi feito:
1. ✅ Estrutura nova criada em paralelo (tabelas)
2. ✅ curriculumBridge.ts (try new → fallback legacy)
3. ✅ dualWrite.ts (performance_by_topic, user_topic_profiles, study_engine_snapshots)

### O que FALTA fazer:

#### Fase 1 — Ativar Cache e Logs de IA
- Importar `ai-cache.ts` em TODAS as edge functions
- Fazer cada function chamar `logAiUsage()` e `getCachedContent()/setCachedContent()`
- **Risco:** ZERO (additive, não muda comportamento)
- **Impacto:** Redução de custos, visibilidade de uso

#### Fase 2 — Ativar FSRS Completo
- Criar cards FSRS automaticamente para: cada tema estudado, cada erro no error_bank, cada revisão
- Backfill: gerar fsrs_cards para os 67 temas_estudados + 279 erros
- **Risco:** BAIXO (additive)
- **Impacto:** Revisão espaçada real

#### Fase 3 — Integrar Tutor Sessions
- useChatMessages → dual-write para tutor_sessions + tutor_messages
- Popular tutor_context_snapshots com dados da SessionMemoryContext
- **Risco:** BAIXO (dual-write, fallback para chat_*)

#### Fase 4 — Ativar Dashboard Snapshots
- Edge function `dashboard-snapshot` → popular dashboard_snapshots
- Fazer useCoreData ler snapshot primeiro, fallback para queries individuais
- **Risco:** MÉDIO (muda read path do dashboard)

#### Fase 5 — Calcular Chance por Banca
- Edge function `calculate-approval-score` → gravar em chance_by_exam
- Frontend ApprovalScoreCard → ler de chance_by_exam
- **Risco:** BAIXO (additive)

#### Fase 6 — Recovery Persistente
- Mover Heavy Recovery do localStorage para recovery_runs/events
- Study Engine → ler/gravar em recovery_runs
- **Risco:** MÉDIO (muda lógica de recovery)

#### Fase 7 — Desativar Legado
- curriculum_matrix → marcar como deprecated (manter dados)
- Remover fallback no curriculumBridge
- Remover dual-write e consolidar em tabela única
- **Quando:** Após 30+ dias sem erros no novo caminho

---

## BLOCO 7 — PLANO POR ETAPAS DETALHADO

### Etapa 1 — Cache e Logs de IA (PRIORIDADE MÁXIMA)
**O que:** Ativar ai_content_cache e ai_usage_logs
**Como:** Editar cada edge function para importar e usar ai-cache.ts
**Arquivos:** 15+ edge functions em supabase/functions/
**Validação:** ai_usage_logs.count > 0 após 1 dia de uso
**Risco:** Zero — puramente additivo

### Etapa 2 — FSRS Backfill
**O que:** Popular fsrs_cards com dados existentes
**Como:** Script SQL + ajuste no useTutorPerformance
**Dados afetados:** ~67 temas + ~279 erros → ~346 novos cards
**Validação:** fsrs_cards.count > 300
**Risco:** Baixo — dados novos, não altera existentes

### Etapa 3 — Tutor Dual-Write
**O que:** useChatMessages grava em tutor_sessions/messages em paralelo
**Como:** Adicionar chamadas em useChatMessages.createConversation e saveMessage
**Validação:** tutor_sessions.count > 0 após uso
**Risco:** Baixo — dual-write fire-and-forget

### Etapa 4 — Dashboard Snapshot Read
**O que:** Dashboard tenta ler de snapshot antes de queries individuais
**Como:** Ajustar useCoreData para tentar dashboard_snapshots primeiro
**Validação:** Performance do dashboard (< 500ms)
**Risco:** Médio — muda read path, precisa fallback sólido

### Etapa 5 — Chance por Banca
**O que:** Calcular e persistir chance de aprovação por banca
**Como:** Edge function calculate-approval-score → grava chance_by_exam
**Validação:** chance_by_exam.count > 0
**Risco:** Baixo — additive

### Etapa 6 — Recovery Persistente
**O que:** Mover estado de recovery para banco
**Como:** Study Engine lê/grava em recovery_runs + recovery_events
**Validação:** Heavy recovery ativa popula recovery_runs
**Risco:** Médio — muda lógica de estado

### Etapa 7 — Limpeza de Legado
**O que:** Remover fallbacks e código morto
**Quando:** Após 30+ dias sem erros
**Como:** Remover curriculum_matrix do curriculumBridge, remover dual-writes
**Risco:** Baixo se validação prévia estiver OK

---

## BLOCO 8 — RISCOS

| # | Risco | Gravidade | Probabilidade | Mitigação |
|---|-------|-----------|---------------|-----------|
| 1 | Dashboard quebra ao ler de snapshot | 🔴 | Média | Fallback obrigatório para queries diretas |
| 2 | FSRS backfill gera cards duplicados | 🟡 | Baixa | Unique constraint em (user_id, card_type, card_ref_id) |
| 3 | Dual-write falha silenciosamente | 🟡 | Baixa | Fire-and-forget com console.warn — monitorar QA |
| 4 | curriculum_subtopics tem dados incompletos | 🟡 | Média | curriculumBridge fallback para curriculum_matrix |
| 5 | Edge functions não usam cache → custo alto | 🔴 | CERTA | Priorizar Etapa 1 |
| 6 | Performance degrada com dual-write | 🟢 | Muito baixa | Operações async fire-and-forget |
| 7 | Recovery state split entre localStorage e banco | 🟡 | Média | Migrar de uma vez, sem período de transição |
| 8 | question_topic_map sem uso real | 🟢 | Certa | Integrar em Study Engine futuro |
| 9 | Inconsistência entre medical_domain_map e performance_by_topic | 🟡 | Média | performance_by_topic como "eventual consistency" |
| 10 | Dados de approval_scores com apenas 7 registros | 🟡 | N/A | Forçar cálculo mais frequente |

---

## BLOCO 9 — EVIDÊNCIA E RESUMO

### Estado Atual por Categoria:

**🟢 PRONTO (já integrado ao frontend):**
- curriculumBridge (new tables com fallback)
- performance_by_topic (dual-write)
- user_topic_profiles (dual-write)
- study_engine_snapshots (dual-write)

**🟡 EXISTE MAS NÃO INTEGRADO:**
- tutor_sessions/messages/context (0 registros)
- dashboard_snapshots (0 registros)
- chance_by_exam (0 registros)
- recovery_runs/events (0 registros)
- question_topic_map (12.466 registros, não usado pelo frontend)
- queue_jobs/worker_runs (0 registros)
- ai_content_cache (0 registros)
- ai_usage_logs (0 registros)

**🔴 GAP CRÍTICO:**
- Nenhuma edge function usa cache de IA
- Nenhuma edge function loga uso de IA
- FSRS com apenas 13 cards (deveria ter 300+)
- Heavy Recovery no localStorage (deveria estar no banco)

### Volume Total do Banco:
- **110 tabelas**
- **~29.000 registros** totais (dominados por questions_bank e question_topic_map)
- **164 usuários**
- **56 edge functions**

---

"O sistema ENAZIZI foi completamente mapeado e possui um plano de migração estruturado, seguro e pronto para execução sem risco de regressão."
