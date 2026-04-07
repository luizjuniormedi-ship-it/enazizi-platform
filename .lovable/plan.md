

# Sprint Estrutural ENAZIZI — Conclusão Centralizada + Missão Agrupada + Sincronização

## Estado Atual (o que JÁ existe)

O sistema já tem boa parte da infraestrutura implementada:

- **`completeStudyAction()`** já existe em `src/lib/completeStudyAction.ts` com IDs canônicos (`sourceRecordId`, `fsrsCardId`, `errorBankId`, `dailyPlanTaskId`)
- **9 módulos** já chamam `completeStudyAction`: MissionMode, ChatGPT, Flashcards, Simulados, ClinicalSimulation, AnamnesisTrainer, PracticalExam, CronogramaInteligente, e QuestionsBank (via Simulados)
- **Study Engine** já agrupa revisões por tema com `pendingCount`, `pendingReviewIds`, `nextReviewDate`
- **MissionTaskActions** já exibe "Concluí 1/N" para revisões agrupadas
- **MissionTaskList** já mostra badge "Nx" para pendentes
- **useMissionMode** já decrementa `pendingCount` ao concluir 1 revisão agrupada
- **`refreshAll()`** já é chamado em todos os módulos após conclusão

## Lacunas Identificadas (o que falta corrigir)

### Lacuna 1 — `syncDailyPlan` ainda usa matching textual
A função `syncDailyPlan()` (linha 209-241 de completeStudyAction.ts) usa `ilike("title", ...)` em vez do `dailyPlanTaskId` canônico que já está disponível no payload.

### Lacuna 2 — `dailyPlanTaskId` não é passado para `syncDailyPlan`
A chamada na linha 353 não repassa `payload.dailyPlanTaskId` — a função só recebe `topic`.

### Lacuna 3 — Study Engine não injeta `dailyPlanTaskId` nas tarefas
O engine gera `sourceRecordId` e `fsrsCardId`, mas não cruza com `daily_plan_tasks` para injetar o ID correspondente.

### Lacuna 4 — `markTaskCompleted.ts` é código legado morto
O arquivo `src/lib/markTaskCompleted.ts` usa a lógica antiga baseada em texto. Deve ser removido para evitar confusão.

### Lacuna 5 — MissionTaskList não mostra "(N pendentes)" no texto
O badge "Nx" é discreto; o texto deveria dizer "Revisão: IVAS · 2 pendentes" conforme solicitado.

---

## Plano de Implementação

### Passo 1 — Corrigir `syncDailyPlan` para usar ID canônico

**Arquivo**: `src/lib/completeStudyAction.ts`

- Alterar assinatura de `syncDailyPlan` para receber `dailyPlanTaskId?: string`
- Se `dailyPlanTaskId` fornecido → update direto por ID (sem ilike)
- Manter fallback textual para módulos que ainda não enviam o ID
- Passar `payload.dailyPlanTaskId` na chamada principal (linha 353)

### Passo 2 — Study Engine injeta `dailyPlanTaskId`

**Arquivo**: `src/lib/studyEngine.ts`

- Após gerar as recomendações, buscar `daily_plan_tasks` do dia atual
- Cruzar por `sourceRecordId` ou `topic` para vincular o `dailyPlanTaskId` a cada tarefa
- Isso fecha o ciclo: engine → missão → conclusão → daily plan, tudo por ID

### Passo 3 — Melhorar exibição de revisões agrupadas

**Arquivo**: `src/components/mission/MissionTaskList.tsx`

- Para tarefas com `pendingCount > 1`, exibir: `"{topic} · {N} pendentes"` no texto principal
- Remover badge "Nx" redundante e colocar a informação no texto

### Passo 4 — Remover código legado

**Arquivo**: `src/lib/markTaskCompleted.ts`

- Verificar que nenhum import referencia este arquivo
- Remover o arquivo

### Passo 5 — Garantir `refreshAll` no fluxo de conclusão manual

**Arquivo**: `src/pages/MissionMode.tsx`

- Já chama `refreshAll()` após `completeCurrentTask("manual")` — confirmar que está correto (já está na linha 75)

---

## Arquivos alterados

1. `src/lib/completeStudyAction.ts` — syncDailyPlan por ID canônico
2. `src/lib/studyEngine.ts` — injetar dailyPlanTaskId nas recomendações
3. `src/components/mission/MissionTaskList.tsx` — texto "· N pendentes"
4. `src/lib/markTaskCompleted.ts` — remover (se não houver imports)

## O que NÃO muda

- Schema do banco de dados
- Edge Functions
- Fluxo de autenticação
- useMissionMode (já funciona corretamente)
- Outros módulos (já integrados com completeStudyAction)

