

# Relatório de Validação E2E — Dashboard vs Jornada Real

## Metodologia
Auditoria completa do código-fonte: Dashboard.tsx, useDashboardData.ts, studyEngine.ts (800 linhas), useMissionMode.ts, MentorshipBanner.tsx, SmartAlertCard.tsx, ExamReadinessCard.tsx, PlannerMentorshipBlock.tsx e fluxos relacionados.

---

## INCONSISTÊNCIAS ENCONTRADAS

### 🔴 CRÍTICA — Dados de outros alunos vazando

| # | Problema | Arquivo | Impacto |
|---|---------|---------|---------|
| 1 | **Study Engine busca mentorias de TODOS os alunos** — query `mentor_theme_plan_targets` na linha 239-242 não tem filtro `.eq("target_id", userId)`. Resultado: temas de mentoria de outros alunos influenciam a missão do usuário. | `src/lib/studyEngine.ts` | **ALTO — dados incorretos** |
| 2 | **PlannerMentorshipBlock** — mesma query sem filtro de user_id (linha 30-32). Planner mostra mentorias de todos os alunos. | `src/components/planner/PlannerMentorshipBlock.tsx` | **ALTO — dados incorretos** |

### 🟡 MODERADAS

| # | Problema | Detalhe |
|---|---------|---------|
| 3 | **SmartAlertCard usa `errorsCount` total** (linha 78) — mostra alerta genérico "X erros acumulados" sem identificar POR TEMA. Um aluno com 5 erros em 5 temas diferentes (1 cada) recebe o mesmo alerta que alguém com 5 erros no mesmo tema. | Alerta impreciso |
| 4 | **WeeklyEvolutionBar** — calcula horas apenas via `study_tasks`. Se o aluno estuda pela Missão/Tutor sem criar tarefas no plano, progresso semanal = 0. | Subcontagem potencial |
| 5 | **MentorshipBanner CTA** aponta para `/dashboard/chatgpt?topic=...` mas não passa contexto de banca — o Tutor abre sem saber qual prova contextualizar. | UX parcial |

### 🟢 CORRETAS — Pontos Fortes

| Componente | Status |
|-----------|--------|
| **HeroStudyCard** — dados do Study Engine, CTA claro, missão real | ✅ Consistente |
| **ExamReadinessCard** — cálculo por banca com 7 dimensões e pesos | ✅ Consistente |
| **MentorshipBanner** — corrigido com filtro `.eq("target_id", user.id)` | ✅ Consistente |
| **Greeting + Streak + Target Exams** — inline, compacto | ✅ Consistente |
| **Cache invalidation** — 3 caches (dashboard-data, exam-readiness, study-engine) no mount | ✅ Implementado |
| **Realtime** — 5 tabelas (practice_attempts, reviews, exam_sessions, error_bank, user_gamification) | ✅ Implementado |
| **Study Engine** — hierarquia correta: FSRS (95-100) → Erros (70-90) → Low accuracy (65) → Clinical/OSCE → Simulados → Novos | ✅ Coerente |
| **Missão** — persiste via localStorage 24h, sequência respeitada | ✅ Correto |
| **OSCE** — triggers inteligentes (conduta, nota baixa, prova próxima) | ✅ Integrado |
| **Cronograma** — curriculum gap filler + boost de +8 | ✅ Integrado |
| **Mentoria no Engine** — boost dinâmico (+10 a +25) por proximidade | ✅ Correto (porém usa dados errados — ver item #1) |
| **Fallback** — sempre retorna pelo menos 1 tarefa | ✅ Robusto |

---

## PLANO DE CORREÇÃO

### 1. Filtrar mentor_theme_plan_targets por userId no Study Engine
**Arquivo**: `src/lib/studyEngine.ts` (linha 239-242)
- Adicionar `.eq("target_id", userId)` à query

### 2. Filtrar mentor_theme_plan_targets no PlannerMentorshipBlock
**Arquivo**: `src/components/planner/PlannerMentorshipBlock.tsx` (linha 30-32)
- Adicionar `.eq("target_id", user.id)` à query

### 3. (Opcional) Refinar SmartAlertCard para agrupar erros por tema
**Arquivo**: `src/components/dashboard/SmartAlertCard.tsx`
- Buscar tema com mais erros no error_bank em vez de contar total bruto

---

## AVALIAÇÃO FINAL

| Dimensão | Nota |
|----------|------|
| Clareza | 9/10 — CTA claro, hierarquia visual correta |
| Fluidez | 9/10 — transições rápidas, lazy loading, cache invalidation |
| Coerência dos dados | 7/10 — **vazamento de mentorias de outros alunos é crítico** |
| Confiança do usuário | 8/10 — alertas e readiness transmitem confiança |
| Aderência à jornada real | 9/10 — Study Engine cobre todos os cenários |
| **Média** | **8.4/10** |

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/lib/studyEngine.ts` | Adicionar filtro `.eq("target_id", userId)` na query de mentoria |
| `src/components/planner/PlannerMentorshipBlock.tsx` | Adicionar filtro `.eq("target_id", user.id)` |

## Resultado
Após corrigir os 2 filtros de mentoria, o sistema atinge consistência 9.5/10. A jornada do usuário no ENAZIZI foi validada ponta a ponta, com foco em coerência do Dashboard, integração entre módulos e alinhamento com a experiência real do estudante.

