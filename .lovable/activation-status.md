# ENAZIZI — Status de Ativação Plena
**Data:** 2026-04-04

## 🟢 PRINCIPAL (ativo, fonte de verdade)

| Subsistema | Tabela/Componente | Status | Fallback |
|---|---|---|---|
| **Dashboard** | `dashboard_snapshots` via `loadDashboardSnapshot()` | ✅ Principal | Full queries (`useDashboardData`) |
| **Approval Score** | `approval_scores` via edge function | ✅ Principal | — |
| **Chance por Banca** | `chance_by_exam` (5 registros) | ✅ Principal | — |
| **FSRS** | `fsrs_cards` (359 cards, dedup ativo) | ✅ Principal | — |
| **Recovery Mode** | `recovery_runs` + `recovery_events` via `recoveryPersistence.ts` | ✅ Principal | localStorage bridge (migração) |
| **Cache IA** | `ai_content_cache` (3 entradas, 2 hits) | ✅ Principal | Chamada IA direta |
| **Logs IA** | `ai_usage_logs` (micro-quiz confirmado) | ✅ Principal | — |
| **Daily Plan Tasks** | `daily_plan_tasks` (relacional) | ✅ Principal | `plan_json` (legado) |

## 🟡 TRANSIÇÃO (dual-write, observação)

| Subsistema | Status | Quando sai |
|---|---|---|
| **Tutor dual-write** | `tutor_sessions`/`tutor_messages`/`tutor_context_snapshots` — escrita paralela ativa, leitura ainda no legado | Quando volume real > 100 sessões e leitura validada |
| **curriculumBridge** | Ponte para `curriculum_matrix` legado | Quando nova estrutura curricular cobrir 100% dos fluxos |

## 🔵 FALLBACK (proteção, não caminho principal)

| Fallback | Protege | Critério de remoção |
|---|---|---|
| Dashboard full queries | Snapshot stale/ausente (>10min) | Quando snapshots cobrindo >95% dos acessos |
| `plan_json` em `daily_plans` | Plans legados sem tasks | Quando backfill total concluído |
| localStorage bridge (recovery) | Usuários com estado local antigo | Após 30 dias sem migração pendente |
| `chat_conversations`/`chat_messages` | Tutor legado (leitura) | Após migração de leitura do tutor |

## 📊 Dados Reais Pós-Ativação

| Tabela | Registros |
|---|---|
| `dashboard_snapshots` | 1 |
| `approval_scores` | 9 |
| `chance_by_exam` | 5 |
| `fsrs_cards` | 359 |
| `ai_content_cache` | 3 (2 hits) |
| `ai_usage_logs` | 1 |
| `recovery_runs` | 0 (aguarda trigger real) |
| `tutor_sessions` | 0 (aguarda uso real do chat) |
| `daily_plan_tasks` | populado para todos os plans |

## ⚠️ Riscos Restantes

1. **Tutor/Recovery sem volume real** — estrutura pronta mas precisa de interação de alunos para validação estatística
2. **Logs de streaming assíncronos** — funções SSE (study-session, coach) logam fire-and-forget, pode haver perda esporádica
3. **Cache hit rate** — apenas micro-quiz cacheando consistentemente; funções streaming não cacheiam respostas (correto por design)

## ✅ Prontidão para Escala

- [x] Build limpo (0 erros TS)
- [x] Bundle principal: 330KB (redução de 53%)
- [x] Snapshot dashboard ativo com fallback
- [x] FSRS consolidado sem duplicidade
- [x] Recovery persistente em banco
- [x] Cache/logs operacionais
- [x] Tutor dual-write ativo
- [x] Índices de performance criados
- [x] RLS ativo em todas as tabelas críticas
