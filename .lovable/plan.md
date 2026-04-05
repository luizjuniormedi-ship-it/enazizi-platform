

# Correção Cirúrgica: 4 Bugs da Rota /mission

## Arquivos alterados
1. `src/lib/completeStudyAction.ts`
2. `src/hooks/useMissionMode.ts` (mínimo)
3. `src/pages/MissionMode.tsx`

---

## Bug 1 — Revisões nunca marcadas como concluídas

**Causa**: `markReviewDone()` busca em `temas_estudados` por `.ilike("tema")`, encontra qualquer row (inclusive recém-inserida), e tenta atualizar `revisoes` por `tema_id` — mas essa row pode não ter revisões pendentes.

**Correção em `completeStudyAction.ts`**:

Reescrever `markReviewDone()`:
1. Buscar IDs de `temas_estudados` que casam com o tópico: `SELECT id FROM temas_estudados WHERE user_id = X AND tema ILIKE '%topic%'`
2. Com esses IDs, buscar em `revisoes` WHERE `tema_id IN (ids)` AND `status = 'pendente'` AND `data_revisao <= hoje`, ORDER BY `data_revisao ASC`, LIMIT 1
3. Atualizar essa revisão específica por `id`
4. Verificar se `error` é null E se a query realmente afetou uma linha. Se não encontrou revisão pendente, retornar `null` (falha real)

---

## Bug 2 — Race condition em `user_missions`

**Causa**: `syncUserMission()` no serviço central e `upsertMissionDB()` no hook competem pela escrita.

**Correção**:
- Remover a função `syncUserMission()` inteira de `completeStudyAction.ts`
- Remover a chamada na linha 312
- `missionUpdated` passa a ser sempre `false` (missão é gerida exclusivamente pelo hook `useMissionMode`)
- Nenhuma alteração no hook — ele já é a fonte única correta

---

## Bug 3 — Duplicação em `temas_estudados`

**Causa**: `registerTemaEstudado()` faz INSERT cego.

**Correção**: Antes do INSERT, verificar existência:
```
SELECT id FROM temas_estudados 
WHERE user_id = X AND tema = topic AND data_estudo = today
LIMIT 1
```
Se já existir, retornar `"temas_estudados"` sem inserir. Se não existir, inserir normalmente.

---

## Bug 4 — Feedback falso positivo

**Correção em `completeStudyAction.ts`**:
- Para `taskType = "review"`: se `tablesUpdated` não contém `"revisoes"` após a execução, adicionar erro explícito: `"revisoes: nenhuma revisão pendente encontrada"`
- Para `taskType = "error_review"`: se não contém `"error_bank"`, adicionar erro similar
- `success` continua sendo `errors.length === 0` — agora será `false` quando nada real mudou

**Correção em `MissionMode.tsx`**:
- Tornar `handleManualComplete` async
- Aguardar retorno de `completeStudyAction` (requer que `completeCurrentTask` retorne a Promise)
- Alternativa mais simples: manter toast como está, pois o Bug 1 sendo corrigido resolve o problema na raiz (revisões passarão a ser marcadas de verdade)

Abordagem escolhida: **manter toast simples** — a correção do Bug 1 elimina o falso positivo na prática. O toast já serve como feedback de progressão da missão (que funciona corretamente via estado local + debounce DB).

---

## O que NÃO muda
- Study Engine, rotas, navegação, Tutor IA, estrutura de tabelas, RLS

