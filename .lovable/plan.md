

# Otimização de Escala e Performance — ENAZIZI

## Diagnóstico Atual

O sistema já possui `useCoreData` centralizando 12 queries do Dashboard. Porém, **3 gargalos estruturais** ainda causam carga excessiva:

```text
Fonte de carga              | Queries extras  | Frequência
----------------------------|-----------------|------------------
StudyEngine (studyEngine.ts)| 12-14 queries   | A cada mount + staleTime 2min
WeeklyGoals (useWeeklyGoals)| 12 queries      | 6 próprias + 6 da semana anterior
DashboardData               | 15 queries      | Já parcialmente otimizado
```

**Total por abertura do Dashboard:** ~40 queries por usuário (muitas duplicadas com coreData).

---

## Plano de Otimização (5 alterações)

### 1. Fazer o Study Engine consumir `useCoreData`

**Problema:** `generateRecommendations()` em `studyEngine.ts` faz 12 queries próprias (revisoes, error_bank, practice_attempts, exam_sessions, profiles, etc.) — dados que `useCoreData` já tem.

**Solução:** Refatorar `generateRecommendations` para aceitar um parâmetro opcional `coreData?: CoreDataResult`. Quando presente, reutilizar esses dados em vez de re-consultar. Queries exclusivas do Engine (como `desempenho_questoes`, `fsrs_cards`, `mentor_theme_plan_targets`) continuam independentes.

**Resultado:** Elimina ~7 queries duplicadas por execução do Engine.

**Arquivos:** `src/lib/studyEngine.ts`, `src/hooks/useStudyEngine.ts`

### 2. Fazer `useWeeklyGoals` usar dados existentes em vez de queries próprias

**Problema:** `fetchWeeklyProgress()` faz 6 queries com filtro `gte(created_at, monday)` — dados que poderiam ser derivados do `useCoreData` (practice_attempts, revisoes, temas_estudados) + dados do dashboardData.

**Solução:** Para a semana atual, filtrar os dados já carregados no coreData/dashboardData por data no client-side. Manter apenas a query da semana anterior (carryover) como query independente, reduzida a contagens.

**Resultado:** Elimina ~10 queries (6 semana atual + 4 duplicadas da anterior).

**Arquivos:** `src/hooks/useWeeklyGoals.ts`

### 3. Dashboard Snapshot via Edge Function (cache server-side)

**Problema:** Cada abertura do Dashboard monta tudo do zero, mesmo que o usuário tenha saído há 30 segundos.

**Solução:** Criar uma edge function `dashboard-snapshot` que:
- Consolida métricas principais (prepIndex, metas, revisões pendentes, missão)
- Armazena na tabela `dashboard_snapshots` (user_id, snapshot_json, updated_at)
- É atualizada após ações do usuário (via trigger ou chamada assíncrona)
- O Dashboard carrega o snapshot primeiro (resposta instantânea) e depois valida com dados frescos em background

**Resultado:** Dashboard abre instantaneamente; queries pesadas rodam em background.

**Arquivos:** Nova edge function `supabase/functions/dashboard-snapshot/index.ts`, nova migração para tabela, ajuste em `useDashboardData.ts`

### 4. Rate limiting de IA por usuário

**Problema:** Sem controle, um usuário pode disparar dezenas de chamadas de IA simultâneas.

**Solução:** Adicionar controle no `ai-fetch.ts` compartilhado:
- Verificar contagem de chamadas por `user_id` nos últimos 60 segundos na tabela `ai_usage_logs`
- Limite: 10 chamadas/minuto por usuário (configurável)
- Retornar erro amigável quando excedido

**Arquivos:** `supabase/functions/_shared/ai-fetch.ts`, ajuste nos edge functions que recebem userId

### 5. Otimizar Realtime — reduzir tabelas monitoradas

**Problema:** O Dashboard subscreve 9 tabelas em Realtime simultaneamente. Muitas delas (anamnesis_results, chronicle_osce_sessions) mudam raramente.

**Solução:** Reduzir para 4 tabelas críticas (practice_attempts, revisoes, user_gamification, fsrs_cards). As demais atualizam via invalidação no próximo staleTime (2-3 min).

**Resultado:** Reduz conexões Realtime de 9 para 4 por usuário.

**Arquivos:** `src/pages/Dashboard.tsx` (linhas 116-127)

---

## Estimativa de Impacto

```text
Métrica                  | Antes    | Depois
-------------------------|----------|----------
Queries por Dashboard    | ~40      | ~18
Subscriptions Realtime   | 9        | 4
Tempo de abertura        | 1-3s     | <500ms (snapshot)
IA rate limit            | Nenhum   | 10/min/user
Capacidade estimada      | ~80 users| ~200 users
```

Para escalar além de 200 usuários, será necessário upgrade de instância (mencionado na documentação de Advanced Settings do backend).

---

## O que NÃO muda
- Regras de negócio (Study Engine, FSRS, missão, metas, recuperação pesada)
- Estrutura do `useCoreData` (já correto)
- Experiência do usuário (mais rápido, não diferente)
- Lógica pedagógica

## Ordem de execução
1. Refatorar Study Engine para consumir coreData (~7 queries eliminadas)
2. Refatorar WeeklyGoals para derivar da semana atual via client-side (~10 queries eliminadas)
3. Reduzir Realtime de 9 para 4 tabelas
4. Criar tabela + edge function `dashboard-snapshot`
5. Adicionar rate limiting de IA
6. Atualizar `useDashboardData` para usar snapshot como fast-path

