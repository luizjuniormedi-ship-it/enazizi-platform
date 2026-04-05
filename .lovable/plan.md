

# Plano: Corrigir markTaskCompleted para usar colunas corretas

## Problema identificado no teste

O `markTaskCompleted.ts` usa colunas que **não existem** na tabela `revisoes`:
- Usa `tema` → tabela tem `tema_id` (uuid, FK para `temas_estudados`)
- Usa `revisada` → tabela tem `status` ('pendente' → 'concluida')
- Usa `data_revisao` para marcar → tabela tem `concluida_em`

Resultado: a query falha silenciosamente (catch vazio), o Study Engine continua vendo `status = 'pendente'` e regenera as mesmas revisões.

## Evidência do teste

- Banco **registrou** em `temas_estudados` (fonte: `mission_manual`) ✅
- Banco **NÃO atualizou** `revisoes.status` para 'concluida' ❌
- Dashboard continua mostrando **40 revisões pendentes** após completar 2 tarefas ❌
- Missão internamente avançou (1/5 → 2/5) ✅ mas ao voltar mostra "COMEÇAR MISSÃO" novamente

## Correção

### `src/lib/markTaskCompleted.ts`

**Seção 1 — Revisões**: Substituir query com coluna inexistente por query correta:

```ts
// ANTES (quebrado):
await supabase.from("revisoes")
  .update({ revisada: true, data_revisao: today })
  .eq("user_id", userId)
  .ilike("tema", `%${topic}%`)

// DEPOIS (correto):
// 1. Buscar tema_id na tabela temas_estudados
const { data: temaRow } = await supabase
  .from("temas_estudados")
  .select("id")
  .eq("user_id", userId)
  .ilike("tema", `%${topic}%`)
  .limit(1)
  .maybeSingle();

if (temaRow) {
  await supabase.from("revisoes")
    .update({ status: "concluida", concluida_em: now })
    .eq("user_id", userId)
    .eq("tema_id", temaRow.id)
    .eq("status", "pendente");
}
```

**Seção 2 — FSRS cards**: A query FSRS já está correta (usa `card_ref_id`), manter como está.

**Seção 3 — Error bank**: A query error_bank já está correta (usa `tema`), manter como está.

## Arquivos afetados
1. **Editar**: `src/lib/markTaskCompleted.ts` — corrigir query de revisões

## O que NÃO muda
- Study Engine, tabelas, rotas, useMissionMode

