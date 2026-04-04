

# Otimização de Performance do Dashboard — Plano de Correção

## Estado Atual

O `useCoreData` já foi criado e os hooks `usePreparationIndex`, `useExamReadiness` e `useDashboardData` já o consomem. Porém, restam **4 gargalos estruturais** que mantêm o sistema fazendo queries desnecessárias:

### Gargalo 1 — Invalidação agressiva no mount do Dashboard
`Dashboard.tsx` (linhas 94-99) invalida `core-data`, `dashboard-data`, `exam-readiness` e `study-engine` **toda vez que o componente monta**. Com `staleTime: 30s` no dashboard-data, qualquer navegação interna causa refetch total.

### Gargalo 2 — Realtime sem debounce
O canal `dashboard-live` (linhas 103-128) chama `invalidateAll` ou `invalidateDash` imediatamente a cada evento PostgreSQL. Um batch de 5 questões respondidas gera 5 cascatas de invalidação em sequência.

### Gargalo 3 — `useJourneyRefresh` não invalida `core-data`
O hook de refresh ao login/visibilidade invalida 7 chaves mas **não inclui `core-data`**, causando dados stale após retorno de inatividade.

### Gargalo 4 — staleTime/refetchOnWindowFocus inconsistentes
- `useDashboardData`: staleTime 30s, refetchOnWindowFocus: true → refetch a cada tab switch
- `useWeeklyGoals`: staleTime 60s, refetchOnWindowFocus: true → idem
- `useStudyEngine`: refetchOnWindowFocus: true → idem
- `useCoreData`: staleTime 3min, refetchOnWindowFocus: false ✓ (correto)

## Correções

### 1. Dashboard.tsx — Remover invalidação no mount
Remover o `useEffect` das linhas 94-99. O Realtime e o `useJourneyRefresh` já cuidam de atualizar quando necessário. A invalidação no mount causa refetch desnecessário quando o usuário apenas navega entre páginas.

### 2. Dashboard.tsx — Adicionar debounce no Realtime
Substituir as chamadas diretas `invalidateAll`/`invalidateDash` por uma versão com debounce de 1.5 segundos. Assim, múltiplos eventos em sequência geram apenas 1 invalidação.

### 3. useJourneyRefresh.ts — Adicionar `core-data` às chaves
Incluir `["core-data"]` no array `JOURNEY_QUERY_KEYS` para que login, token refresh e retorno de inatividade também atualizem a camada central.

### 4. Alinhar staleTime e refetchOnWindowFocus
- `useDashboardData`: staleTime → 2min, refetchOnWindowFocus → false
- `useWeeklyGoals`: staleTime → 3min, refetchOnWindowFocus → false
- `useStudyEngine`: refetchOnWindowFocus → false

Todos dependem de invalidação manual (Realtime + JourneyRefresh), não de polling por tab switch.

### 5. Realtime — Invalidação seletiva por tabela
Em vez de `invalidateAll` para tudo, usar invalidação por escopo:
- `practice_attempts` → core-data, dashboard-data, weekly-goals
- `revisoes` → core-data, dashboard-data, weekly-goals
- `exam_sessions` → core-data, dashboard-data, exam-readiness
- `error_bank` → core-data, dashboard-data
- `user_gamification` → core-data, dashboard-data
- `simulation_sessions`, `anamnesis_results`, `chronicle_osce_sessions` → core-data, dashboard-data

## Estimativa de Impacto

```text
Antes:  refetch total em tab switch + refetch total em mount + refetch por evento RT sem debounce
Depois: zero refetch em mount, zero refetch em tab switch, 1 refetch debounced por batch RT
```

Redução estimada: ~60-70% menos invalidações por sessão de uso.

## Arquivos alterados
1. `src/pages/Dashboard.tsx` — remove mount invalidation, adiciona debounce no RT, invalidação seletiva
2. `src/hooks/useJourneyRefresh.ts` — adiciona `core-data` às chaves
3. `src/hooks/useDashboardData.ts` — staleTime 2min, refetchOnWindowFocus false
4. `src/hooks/useWeeklyGoals.ts` — staleTime 3min, refetchOnWindowFocus false
5. `src/hooks/useStudyEngine.ts` — refetchOnWindowFocus false

## O que NÃO muda
- Regras de negócio (Study Engine, FSRS, missão, metas)
- Estrutura do `useCoreData` (já correto)
- Realtime continua ativo (apenas com debounce)
- Experiência do usuário (dados atualizam via RT debounced)

