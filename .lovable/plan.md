

# useCoreData — Camada Centralizada de Dados

## Problema Atual

Quando o Dashboard carrega, **5 hooks independentes** fazem queries às mesmas tabelas simultaneamente:

```text
Tabela                 | Dashboard | PrepIndex | ExamReady | WeeklyGoals | StudyEngine
-----------------------|-----------|-----------|-----------|-------------|------------
practice_attempts      |     ✓     |     ✓     |     ✓     |      ✓      |      ✓
revisoes               |     ✓     |     ✓     |     ✓      |      ✓      |      ✓
exam_sessions          |     ✓     |     ✓     |     ✓     |             |      ✓
anamnesis_results      |     ✓     |     ✓     |     ✓     |      ✓      |      ✓
profiles               |     ✓     |           |     ✓     |             |      ✓
temas_estudados        |           |     ✓     |     ✓     |      ✓      |      ✓
simulation_sessions    |     ✓     |     ✓     |           |      ✓      |
user_gamification      |     ✓     |           |     ✓     |             |
error_bank             |     ✓     |           |           |             |      ✓
```

**Resultado**: ~40-50 queries por carregamento de Dashboard por usuário. Com 100 usuários = ~4000-5000 queries simultâneas.

## Solução

Criar `useCoreData` que busca **uma única vez** os dados compartilhados, e fazer os hooks consumidores lerem do cache do React Query ao invés de queries próprias.

## Arquitetura

```text
useCoreData (1 query composta, staleTime: 3min)
    ├── useDashboardData   → consome coreData + queries exclusivas (flashcards, uploads, etc)
    ├── usePreparationIndex → calcula score a partir de coreData (zero queries próprias)
    ├── useExamReadiness    → calcula readiness a partir de coreData + domain_map
    ├── useWeeklyGoals      → busca apenas contagens da semana (queries com filtro de data)
    └── studyEngine         → continua com queries próprias (roda server-side via React Query)
```

### Decisão importante: StudyEngine

O `studyEngine.ts` é uma função pura (não um hook React), executada dentro de `useStudyEngine`. Ele busca dados com filtros diferentes (`.limit(20)`, `status=pendente`, joins específicos). **Não será refatorado para usar useCoreData** — mantém suas queries otimizadas. Isso evita risco de quebrar a lógica de decisão.

## Implementação

### 1. Criar `src/hooks/useCoreData.ts`

Hook que consolida ~15 queries em uma única função:

- `profiles` (display_name, has_completed_diagnostic, target_exams, target_exam, exam_date)
- `practice_attempts` (correct, created_at) — últimos 500
- `revisoes` (status, data_revisao, updated_at)
- `exam_sessions` (score, total_questions, finished_at) — status=finished
- `anamnesis_results` (final_score, created_at)
- `temas_estudados` (id, tema, especialidade, created_at) — count + temas list
- `simulation_sessions` (count, status=finished)
- `chronicle_osce_sessions` (score)
- `user_gamification` (current_streak, xp, level)
- `error_bank` (count)
- `approval_scores` (score, created_at) — últimos 10
- `medical_domain_map` (specialty, domain_score, questions_answered, correct_answers)

Configuração React Query:
- `queryKey: ["core-data", userId]`
- `staleTime: 3 * 60 * 1000` (3 min)
- `gcTime: 10 * 60 * 1000`
- `refetchOnWindowFocus: false` (invalidação manual)

### 2. Refatorar `useDashboardData`

- Receber `coreData` como dependência
- Remover queries duplicadas (practice_attempts, revisoes, exam_sessions, anamnesis, profiles, gamification, simulation_sessions, error_bank)
- Manter apenas queries exclusivas: flashcards, uploads, study_tasks, study_plans, reviews, discursive_attempts, global counts, summaries, chat_conversations, medical_image_attempts, diagnostic_results, teacher results
- `enabled: !!user && !!coreData`

**Redução**: de ~24 queries para ~14 queries exclusivas.

### 3. Refatorar `usePreparationIndex`

- Receber `coreData` como dependência
- **Eliminar todas as 8 queries próprias** — usar dados do coreData
- Manter apenas lógica de cálculo (cronograma, desempenho, revisões, prática)
- `enabled: !!user && !!coreData`

**Redução**: de 8 queries para 0.

### 4. Refatorar `useExamReadiness`

- Receber `coreData` como dependência
- Manter apenas query exclusiva: `practical_exam_results`
- Usar practice_attempts, domain_map, exam_sessions, anamnesis, revisoes, gamification, temas do coreData
- `enabled: !!user && !!coreData`

**Redução**: de 9 queries para 1.

### 5. Refatorar `useWeeklyGoals`

- Manter queries com filtro de data (`.gte("created_at", mondayISO)`) — essas são exclusivas
- Usar `usePreparationIndex` e `useDashboardData` como já faz (agora mais rápidos)
- Sem mudança estrutural grande, apenas garante que os hooks pai já carregaram via coreData

### 6. Atualizar `useDashboardInvalidation`

- Adicionar invalidação de `["core-data"]` no `invalidateAll()`
- Todos os hooks dependentes recarregam automaticamente

### 7. Atualizar `Dashboard.tsx`

- Adicionar `useCoreData()` no topo
- Passar `coreData` para os hooks refatorados via parâmetro ou context

## Estimativa de Redução

```text
Antes:  ~45 queries por carregamento de Dashboard
Depois: ~25 queries por carregamento de Dashboard
Redução: ~44%
```

Com 100 usuários simultâneos: de ~4500 para ~2500 queries.

## O que NÃO muda

- StudyEngine — mantém queries próprias e lógica intacta
- FSRS, cronograma, missão — não afetados
- Realtime — mantido, apenas invalidação de `core-data` adicionada
- Regras de negócio — zero alteração
- Nenhuma tabela nova ou migração necessária

## Ordem de execução

1. Criar `useCoreData.ts`
2. Refatorar `usePreparationIndex` (elimina 8 queries)
3. Refatorar `useExamReadiness` (elimina 8 queries)
4. Refatorar `useDashboardData` (elimina ~10 queries)
5. Atualizar `useDashboardInvalidation`
6. Atualizar `Dashboard.tsx` para usar `useCoreData`
7. Verificar que `useWeeklyGoals` funciona com hooks refatorados

