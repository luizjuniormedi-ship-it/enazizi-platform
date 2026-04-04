

# Auditoria Completa Pós-Refatoração — ENAZIZI

## 1. Validação de Arquitetura (Pós-Refatoração)

### ✅ Pontos Corretos
- `useCoreData` centraliza 12 queries paralelas com `staleTime: 3min`, `refetchOnWindowFocus: false`
- `usePreparationIndex` → zero queries próprias, usa `useMemo` sobre `coreData` ✅
- `useExamReadiness` → apenas 1 query exclusiva (`practical_exam_results`) ✅
- `useDashboardData` → consome `coreData`, mantém ~13 queries exclusivas ✅
- `useDashboardInvalidation` → inclui `core-data` ✅
- `useJourneyRefresh` → inclui `core-data` e `weekly-goals` ✅
- Dashboard Realtime → debounce 1.5s + invalidação seletiva por tabela ✅
- Sem invalidação no mount do Dashboard ✅
- StudyEngine mantém queries próprias (isolado por design) ✅

### 🔴 BUG CRÍTICO — `useWeeklyGoals` usa `updated_at` que NÃO EXISTE

Na linha 70 de `useWeeklyGoals.ts`, a query de revisões concluídas filtra por `.gte("updated_at", fromISO)`. A tabela `revisoes` **não possui coluna `updated_at`** — apenas `concluida_em`. Resultado: a contagem de revisões semanais retorna **sempre 0**, tornando a meta de revisões impossível de progredir. O carryover também fica errado pois a semana anterior sempre mostra 0 revisões.

**Correção**: trocar `updated_at` por `concluida_em`.

### 🟡 BUG ALTO — `useExamReadiness` ainda tem `refetchOnWindowFocus: true`

Linha 76 de `useExamReadiness.ts` mantém `refetchOnWindowFocus: true`, contradizendo a otimização. Cada tab switch dispara refetch desnecessário deste hook.

**Correção**: trocar para `false`.

---

## 2. Teste de Redução de Queries

```text
Hook                   | Antes  | Depois | Redução
-----------------------|--------|--------|--------
useCoreData            |  —     | 12     | (nova camada)
usePreparationIndex    | 8      | 0      | -100%
useExamReadiness       | 9      | 1      | -89%
useDashboardData       | ~24    | ~15    | -38%
useWeeklyGoals         | 12     | 12     | 0% (mantido — queries com filtro de data)
useStudyEngine         | 14     | 14     | 0% (isolado por design)
-----------------------|--------|--------|--------
Total Dashboard load   | ~67    | ~40    | ~40%
(sem StudyEngine)      | ~53    | ~28    | ~47%
```

A redução real é **~40%** considerando tudo, ou **~47%** excluindo StudyEngine (que é independente por design). Próximo da meta de 50%.

### Queries ainda duplicadas entre Dashboard e StudyEngine

| Tabela | useCoreData | StudyEngine |
|--------|:-----------:|:-----------:|
| practice_attempts | ✓ | ✓ |
| revisoes | ✓ | ✓ |
| exam_sessions | ✓ | ✓ |
| profiles | ✓ | ✓ |
| anamnesis_results | ✓ | ✓ |
| medical_domain_map | ✓ | ✓ |
| error_bank | ✓ (count) | ✓ (full) |

Estas duplicações são **aceitas por design** — o StudyEngine precisa de filtros diferentes (`.status("pendente")`, `.limit(20)`, joins com `temas_estudados`). Não é viável compartilhar sem risco de quebra.

---

## 3. Dashboard — Consistência

- Cards usam dados do `coreData` via `useDashboardData` ✅
- `PreparationIndexCard` usa `usePreparationIndex` → `useCoreData` ✅
- `ExamReadinessCard` usa `useExamReadiness` → `useCoreData` + 1 query ✅
- `WeeklyGoalsCard` usa `useWeeklyGoals` → queries próprias com filtro semanal + `usePreparationIndex`/`useDashboardData` ✅
- `HeroStudyCard` usa `useStudyEngine` (independente) ✅

### 🟡 Componentes com queries independentes fora do fluxo central:
- `StreakCalendar` → query própria de `practice_attempts` (aceitável — drill-down lazy-loaded)
- `DailyGoalWidget` → query própria de `practice_attempts` com filtro de hoje (aceitável — drill-down)
- `EndOfDaySummary` → query própria (aceitável — lazy popup)

---

## 4. Realtime e Debounce

- Debounce de 1.5s implementado ✅
- Invalidação seletiva por tabela ✅
- Limpeza do timer no cleanup ✅
- Tabelas cobertas: `practice_attempts`, `revisoes`, `fsrs_cards`, `exam_sessions`, `error_bank`, `user_gamification`, `simulation_sessions`, `anamnesis_results`, `chronicle_osce_sessions` ✅

### 🟡 Bug potencial no debounce
O debounce usa um **único timer** para todos os eventos. Se `onPractice` dispara e 1s depois `onExam` dispara, o timer é reiniciado e as chaves de `onPractice` são descartadas — apenas `onExam` será invalidado. Deveria acumular as chaves.

**Severidade**: MÉDIA — em uso normal, raramente dois eventos de tabelas diferentes ocorrem em <1.5s.

---

## 5. Cache e StaleTime

```text
Hook                  | staleTime | refetchOnWindowFocus
----------------------|-----------|---------------------
useCoreData           | 3min      | false ✅
useDashboardData      | 2min      | false ✅
useStudyEngine        | 2min      | false ✅
useWeeklyGoals        | 3min      | false ✅
usePreparationIndex   | (memo)    | N/A ✅
useExamReadiness      | 2min      | true ❌ (deveria ser false)
useContentLock        | 2min      | true ⚠️ (não crítico)
```

---

## 6. Study Engine

- Queries próprias com filtros específicos ✅
- `safe()` wrapper previne crash por query individual ✅
- Priorização: revisões → erros → FSRS → mentor → desempenho → novos temas ✅
- Integração com examProfiles para pesos por banca ✅
- Recovery mode implementado ✅
- **Não depende de `useCoreData`** (por design) ✅

---

## 7. Segurança

- Linter: apenas 1 warning (leaked password protection disabled) — **MÉDIO**
- RLS em tabelas principais: ok
- Nenhum dado exposto entre usuários no Realtime (filtro por `user_id`) ✅
- `user_roles` protegido contra escalada ✅

---

## 8. Integridade de Dados

### 🔴 BUG CRÍTICO — Revisões semanais sempre mostram 0
Conforme item 1, `useWeeklyGoals` filtra `revisoes` por `updated_at` que não existe. Meta de revisões nunca progride.

---

## Relatório de Bugs

### 🔴 CRÍTICOS
1. **`useWeeklyGoals` usa `updated_at` em `revisoes`** — coluna não existe, meta de revisões semanais sempre = 0

### 🟠 ALTOS  
2. **`useExamReadiness` tem `refetchOnWindowFocus: true`** — contradiz otimização, causa refetch desnecessário

### 🟡 MÉDIOS
3. **Debounce RT com timer único** — pode descartar invalidações se eventos de tabelas diferentes chegam em <1.5s
4. **Leaked password protection disabled** — risco de segurança em produção

### ⚪ BAIXOS
5. **StudyEngine duplica ~7 queries do coreData** — aceito por design, mas potencial otimização futura
6. **`useContentLock` com `refetchOnWindowFocus: true`** — menor impacto

---

## Notas de 0 a 10

| Critério | Nota |
|----------|------|
| Arquitetura | **8** — camada central bem implementada, StudyEngine isolado por design |
| Consistência de dados | **6** — bug de `updated_at` compromete metas semanais |
| Performance | **8** — redução real de ~40-47%, debounce funcional, staleTime adequado |
| Escalabilidade | **7** — preparado para 100+ usuários, mas StudyEngine ainda faz ~14 queries/usuário |
| UX | **8** — Dashboard coeso, drill-down lazy, sem refetch visível |
| Confiabilidade em produção | **7** — bug de revisões semanais impacta experiência real |

---

## Plano de Correção (3 itens)

### 1. `useWeeklyGoals.ts` — Trocar `updated_at` por `concluida_em`
Linha 70: `.gte("updated_at", fromISO)` → `.gte("concluida_em", fromISO)`

### 2. `useExamReadiness.ts` — Trocar `refetchOnWindowFocus` para `false`
Linha 76: `refetchOnWindowFocus: true` → `refetchOnWindowFocus: false`

### 3. `Dashboard.tsx` — Acumular chaves no debounce
Modificar o debounce para acumular chaves de múltiplos eventos em vez de substituir:
```typescript
const pendingKeysRef = useRef<Set<string>>(new Set());
const debouncedInvalidate = (keys: string[][]) => {
  keys.forEach(k => pendingKeysRef.current.add(JSON.stringify(k)));
  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  debounceTimerRef.current = setTimeout(() => {
    pendingKeysRef.current.forEach(k => 
      queryClient.invalidateQueries({ queryKey: JSON.parse(k) })
    );
    pendingKeysRef.current.clear();
  }, 1500);
};
```

### Arquivos a alterar
1. `src/hooks/useWeeklyGoals.ts` — 1 linha
2. `src/hooks/useExamReadiness.ts` — 1 linha
3. `src/pages/Dashboard.tsx` — ~10 linhas (debounce acumulativo)

