

# Plano: Corrigir "Já concluí" para atualizar revisões e dashboard

## Problema identificado

Quando o usuário clica **"Já concluí"** na missão, o `completeCurrentTask()` apenas atualiza o estado interno da missão (localStorage + `user_missions`). Ele **NÃO**:

1. Marca a revisão como concluída no banco (`revisoes` / `fsrs_cards`)
2. Chama `refreshAll()` para invalidar caches
3. Resultado: o Study Engine continua gerando as mesmas recomendações, o dashboard mostra as mesmas pendências, e ao voltar à tela o assunto reaparece como se nada tivesse sido feito

## Correção

### 1. `src/hooks/useMissionMode.ts` — Adicionar callback de side-effects após completar tarefa

Após `completeCurrentTask`, disparar:

- **Se task.type === "review"**: marcar revisão como concluída no banco (`revisoes` → `revisada = true` ou atualizar `next_review`)
- **Se task.type === "error_review"**: marcar erro como "dominated" no `error_bank`
- **Atualizar FSRS card** se existir (registrar review com grade "good")
- **Chamar `refreshAll()`** para invalidar todos os caches (study-engine, core-data, dashboard-data, mission-mode)

### 2. Criar helper `src/lib/markTaskCompleted.ts`

Função que recebe `userId` + `task` (StudyRecommendation) e executa as escritas no banco:

```
async function markTaskCompleted(userId, task):
  - task.type "review" → UPDATE revisoes SET revisada=true WHERE tema ILIKE task.topic
  - task.type "error_review" → UPDATE error_bank SET status='dominated' WHERE tema ILIKE task.topic
  - Qualquer tipo → UPDATE fsrs_cards SET last_review=now(), due=now()+interval WHERE card matches topic
  - Qualquer tipo → INSERT temas_estudados (registro de estudo)
```

### 3. `src/pages/MissionMode.tsx` — Integrar refreshAll após conclusão

No handler de "Já concluí" e no `completeCurrentTask`, chamar `refreshAll()` após a conclusão para que:
- `PendingReviewsCard` atualize imediatamente (consome `useStudyEngine`)
- Dashboard reflita progresso real
- Ao voltar à tela da missão, o assunto NÃO reapareça

## O que NÃO muda
- Study Engine (lógica de recomendação)
- Estrutura das tabelas
- Fluxo de navegação
- Metodologia do Tutor IA

## Arquivos afetados
1. **Criar**: `src/lib/markTaskCompleted.ts`
2. **Editar**: `src/hooks/useMissionMode.ts` (chamar markTaskCompleted + refreshAll)
3. **Editar**: `src/pages/MissionMode.tsx` (garantir refreshAll no onComplete)

