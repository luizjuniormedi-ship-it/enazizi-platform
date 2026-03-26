

# Plano: Corrigir 3 bugs no Plano do Dia e Cronograma

## Problemas identificados

### Bug 1: Horas diarias nao sao respeitadas
Na linha 205 do `DailyPlan.tsx`, o calculo do `topicBudget` usa `scheduledReviews` (state antigo do render anterior), nao `fittingReviews` (que acabou de ser calculado). Resultado: o budget de tempo para temas iniciais usa dados desatualizados, causando overflow.

```
// BUG: scheduledReviews e o state ANTIGO, nao fittingReviews
const reviewUsed = scheduledReviews.reduce((s, r) => s + (r.estimatedMinutes || 15), 0);
```

### Bug 2: Temas do cronograma somem apos o dia do upload
A query de `todayTopics` filtra `created_at >= todayStart`, mostrando apenas temas criados HOJE. No dia seguinte, se nao houver revisoes pendentes ainda, o plano fica vazio. O correto e mostrar TODOS os temas ativos que tem revisoes pendentes para hoje ou temas sem nenhuma revisao concluida.

### Bug 3: Cronograma nao atualiza outros modulos
O `cronogramaSync.ts` so roda durante a geracao do plano de estudo no `StudyPlanContent.tsx`. Completar revisoes, adicionar temas manualmente, ou concluir blocos no Plano do Dia nao atualiza `study_performance` (contexto do Tutor IA).

## Alteracoes

### 1. Editar `src/pages/DailyPlan.tsx`

**Corrigir budget de tempo (Bug 1):**
- Usar `usedReviewMinutes` (variavel local recem-calculada) no lugar de `scheduledReviews.reduce(...)` na linha 205
- Corrigir: `const topicBudget = userDailyMinutes - usedReviewMinutes;`

**Ampliar query de temas (Bug 2):**
- Trocar query de `temas_estudados` criados hoje para: buscar TODOS os temas ativos do usuario que nao tem nenhuma revisao concluida (primeiro contato) OU que tem revisao pendente para hoje
- Limitar a 20 resultados para performance

**Sincronizar ao completar (Bug 3):**
- Ao marcar revisao como concluida (`toggleReviewDone`), chamar `updateStudyPerformanceContext` para atualizar contexto do Tutor IA
- Ao marcar bloco como concluido (`handleAssessmentSubmit`), idem

### 2. Editar `src/lib/cronogramaSync.ts`

**Exportar funcao de contexto:**
- Exportar `updateStudyPerformanceContext` para poder ser chamada pelo `DailyPlan.tsx` e `CronogramaInteligente.tsx`

### 3. Editar `src/pages/CronogramaInteligente.tsx`

**Sincronizar ao concluir revisao:**
- No `handleCompleteRevisao`, chamar `updateStudyPerformanceContext` apos salvar desempenho

## Arquivos
- Editar: `src/pages/DailyPlan.tsx`
- Editar: `src/lib/cronogramaSync.ts`
- Editar: `src/pages/CronogramaInteligente.tsx`

