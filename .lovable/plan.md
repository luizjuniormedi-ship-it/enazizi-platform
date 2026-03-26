

# Plano: Corrigir erro "messages is not iterable" no generate-flashcards

## Problema
O `cronogramaSync.ts` envia `{ topic, specialty, count }` para a edge function `generate-flashcards`, mas ela espera `{ messages, userContext }`. O campo `messages` fica `undefined` e o spread `...messages` quebra.

## Solucao
Ajustar o `cronogramaSync.ts` para enviar o payload no formato correto da edge function: um array `messages` com a solicitacao de flashcards e o contexto do tema.

## Alteracao

### Editar `src/lib/cronogramaSync.ts` (funcao `generateFlashcardsForTemas`)
- Mudar o body do fetch de `{ topic, specialty, count }` para `{ messages: [{ role: "user", content: "Gere 3 flashcards sobre {tema} na area de {especialidade}" }] }`
- Isso alinha com o que a edge function espera (linhas 13 e 160 do index.ts)

## Arquivos
- Editar: `src/lib/cronogramaSync.ts`

