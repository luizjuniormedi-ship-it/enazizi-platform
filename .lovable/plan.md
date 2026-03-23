

# Plano: Sincronizar Analytics com Dashboard

## Problema

A página Analytics usa lógica de dados **separada e incompleta** comparada ao Dashboard:

| Métrica | Dashboard (`useDashboardData`) | Analytics |
|---------|------|-----------|
| Questões respondidas | `practice_attempts` + `exam_sessions` + `teacher_simulado_results` | Apenas `practice_attempts` |
| Taxa de acerto | Combinada das 3 fontes | Apenas `practice_attempts` |
| Sessões de estudo | `study_performance.historico_estudo` | Idem (ok) |
| Dados de módulos | Contagens via count | Queries completas (ok) |

Além disso, Analytics usa `useEffect` + `setState` raw, sem cache nem revalidação, enquanto o Dashboard usa `useQuery` com staleTime de 30s.

## Solução

Refatorar `Analytics.tsx` para:

1. **Unificar contagem de questões e acurácia** — incluir `exam_sessions` e `teacher_simulado_results` na contagem total, replicando a lógica do `useDashboardData`
2. **Migrar para `useQuery`** — usar React Query com staleTime para cache e revalidação automática, consistente com o Dashboard
3. **Incluir dados de simulados do professor** — `teacher_simulado_results` nos exam scores e na contagem total

## Mudanças

**Arquivo:** `src/pages/Analytics.tsx`

- Adicionar queries para `exam_sessions` (score + total_questions) e `teacher_simulado_results` no bloco de fetching
- Recalcular `totalQuestions` = `practice_attempts.length` + soma de `total_questions` dos exam_sessions + soma de `total_questions` dos teacher_simulado_results
- Recalcular `accuracy` combinando acertos das 3 fontes (mesma fórmula do `useDashboardData`)
- Migrar `useEffect` + `useState` para `useQuery` com `queryKey: ["analytics-data", user?.id]`
- Incluir teacher simulados na lista de `examScores`

