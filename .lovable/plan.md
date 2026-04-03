

# Validação de Consistência: Dashboard vs Jornada Real

## Análise Realizada

Auditei o código do Dashboard, seus componentes, hooks de dados (`useDashboardData`, `useStudyEngine`, `useExamReadiness`, `useMissionMode`) e as fontes de dados de cada card.

## Inconsistências Encontradas

### 🔴 CRÍTICAS

| # | Problema | Arquivo(s) | Impacto |
|---|----------|------------|---------|
| 1 | **Links obsoletos para `/dashboard/banco-questoes`** — 8+ componentes do Dashboard apontam para uma rota que é apenas um redirect (`<Navigate>` → `/dashboard/simulados`). Causa navegação desnecessária e confusão semântica. | `DashboardMetricsGrid.tsx`, `DailyGoalWidget.tsx`, `OnboardingChecklist.tsx`, `SmartRecommendations.tsx`, `SimuladoResult.tsx`, `GlobalSearch.tsx`, `CronogramaAgendaHoje.tsx` | Médio |
| 2 | **Link para `/dashboard/questoes`** no DashboardMetricsGrid (linha 69) — mesma situação, redirect para simulados | `DashboardMetricsGrid.tsx` | Médio |
| 3 | **MentorshipBanner não filtra por user_id** na query `mentor_theme_plan_targets` (linha 34-35) — faz `select("plan_id")` sem filtro, potencialmente retornando mentorias de TODOS os alunos | `MentorshipBanner.tsx` | Alto — dados incorretos |
| 4 | **`exam-readiness` cache não é invalidado** ao retornar ao Dashboard — só `dashboard-data` é invalidado no mount e via realtime. O card de "Chance por prova" pode mostrar dados desatualizados | `Dashboard.tsx`, `useExamReadiness.ts` | Médio |
| 5 | **`study-engine` cache não é invalidado** no mount do Dashboard — HeroStudyCard usa `useStudyEngine` que tem `staleTime: 2min`, pode mostrar tarefas já concluídas | `Dashboard.tsx`, `useStudyEngine.ts` | Alto — missão desatualizada |

### 🟡 MODERADAS

| # | Problema | Detalhe |
|---|----------|---------|
| 6 | **SmartAlertCard usa `errorsCount` total** (linha 78) em vez de erros recorrentes por tema — mostra "tema crítico" quando o aluno tem 5+ erros totais, não por tema | Alerta impreciso |
| 7 | **WeeklyEvolutionBar usa `study_tasks`** para calcular horas, não sessões reais de estudo — se o aluno estuda via Missão/Tutor sem tarefas no plano, progresso semanal = 0 | Subcontagem |
| 8 | **DailyPlanWidget consulta `daily_plans`** que pode não existir se o aluno usa apenas o Study Engine/Missão sem gerar plano diário explícito — widget nunca aparece | Invisibilidade |
| 9 | **Realtime só cobre 2 tabelas** (`practice_attempts`, `reviews`) — atividades em `exam_sessions`, `error_bank`, `user_gamification` não disparam atualização automática | Dados parcialmente stale |

### 🟢 CORRETAS

| Componente | Status |
|------------|--------|
| HeroStudyCard — dados vindos do Study Engine ✅ | Consistente |
| ExamReadinessCard — cálculo direto do banco ✅ | Consistente (porém cache) |
| Greeting + Streak + Target Exams ✅ | Consistente |
| XpWidget — query própria ao `user_gamification` ✅ | Consistente |
| Cache invalidation no mount do Dashboard ✅ | Implementado |
| Missão persistida via localStorage com expiração 24h ✅ | Correto |

## Plano de Correção

### 1. Substituir todos os links `/dashboard/banco-questoes` por `/dashboard/simulados`
Arquivos: `DashboardMetricsGrid.tsx`, `DailyGoalWidget.tsx`, `OnboardingChecklist.tsx`, `SmartRecommendations.tsx`, `SimuladoResult.tsx`, `GlobalSearch.tsx`, `CronogramaAgendaHoje.tsx`

### 2. Corrigir MentorshipBanner — filtrar por user_id
Adicionar `.eq("user_id", user.id)` na query de `mentor_theme_plan_targets`

### 3. Invalidar caches `exam-readiness` e `study-engine` no mount do Dashboard
Adicionar ao `useEffect` existente:
```typescript
queryClient.invalidateQueries({ queryKey: ["exam-readiness"] });
queryClient.invalidateQueries({ queryKey: ["study-engine"] });
```

### 4. Expandir realtime para mais tabelas
Adicionar `exam_sessions`, `error_bank` e `user_gamification` ao channel `dashboard-live` + migration SQL para habilitar realtime nessas tabelas

### 5. Corrigir SmartAlertCard — usar erros por tema (não total)
Buscar contagem do tema com mais erros em vez do total bruto

## Métricas de Qualidade

| Dimensão | Score |
|----------|-------|
| Consistência | 7/10 — links obsoletos e MentorshipBanner sem filtro comprometem |
| Confiabilidade | 7/10 — caches de readiness e engine podem mostrar dados stale |
| Clareza | 9/10 — UI clara, labels em pt-BR, cards informativos |
| Sincronização | 7/10 — realtime parcial (2 de 5+ tabelas relevantes) |
| **Média** | **7.5/10** |

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/Dashboard.tsx` | Invalidar mais caches no mount |
| `src/components/dashboard/DashboardMetricsGrid.tsx` | Trocar links obsoletos |
| `src/components/dashboard/DailyGoalWidget.tsx` | Trocar link obsoleto |
| `src/components/dashboard/OnboardingChecklist.tsx` | Trocar link obsoleto |
| `src/components/dashboard/SmartRecommendations.tsx` | Trocar link obsoleto |
| `src/components/dashboard/SmartAlertCard.tsx` | Refinar lógica de erros |
| `src/components/dashboard/MentorshipBanner.tsx` | Filtrar por user_id |
| `src/components/simulados/SimuladoResult.tsx` | Trocar link obsoleto |
| `src/components/cronograma/CronogramaAgendaHoje.tsx` | Trocar link obsoleto |
| `src/components/layout/GlobalSearch.tsx` | Trocar link obsoleto |
| Migration SQL | Habilitar realtime em `exam_sessions`, `error_bank`, `user_gamification` |

