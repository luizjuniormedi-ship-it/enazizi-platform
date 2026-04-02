

# Auto-Resolver Problemas da Fila WhatsApp

## Problemas Atuais

1. A `daily-bi-whatsapp` cria a execução com colunas erradas (`started_by`, `sent_count`) que podem não existir na tabela, causando falha silenciosa
2. Mesmo quando a execução é criada, mensagens podem ficar com `execution_id = null` se o link falhar
3. Não existe nenhum mecanismo de auto-correção — mensagens órfãs ficam paradas para sempre

## Solução: Dois Mecanismos Automáticos

### 1. Corrigir `daily-bi-whatsapp` para usar a mesma estrutura do `whatsapp-queue`

O `daily-bi-whatsapp` cria a execução com colunas que não batem com as usadas pelo `whatsapp-queue` (`started_by` vs `admin_user_id`, `sent_count` vs `total_sent`). Alinhar para usar as mesmas colunas e incluir `execution_date`.

### 2. Adicionar auto-link no `execution_status` do `whatsapp-queue`

Quando o agente chama `execution_status` (que funciona corretamente), adicionar lógica para:
- Se existe uma execução `running` mas com 0 itens pendentes vinculados, buscar mensagens órfãs (`execution_id IS NULL`, `delivery_status = 'pending'`, do dia atual) e vinculá-las automaticamente
- Se NÃO existe execução ativa, mas existem mensagens pendentes órfãs do dia, criar automaticamente uma execução e vincular

Isso resolve 100% dos casos de travamento sem intervenção manual.

### 3. Adicionar auto-complete na execução

Quando `execution_status` detecta que todos os itens foram processados (nenhum `pending` ou `processing`), marcar a execução como `completed` automaticamente. Isso evita execuções "running" fantasmas.

## Mudanças por Arquivo

### `supabase/functions/daily-bi-whatsapp/index.ts` (linhas 248-297)
- Alinhar colunas do INSERT em `whatsapp_send_executions`:
  - `started_by` → `admin_user_id`
  - `sent_count` / `error_count` → remover (defaults do banco)
  - Adicionar `execution_date: today`
  - Adicionar `started_at: new Date().toISOString()`

### `supabase/functions/whatsapp-queue/index.ts` (action `execution_status`, linhas 263-301)
- Após encontrar execução ativa, verificar se há mensagens órfãs do dia e vinculá-las automaticamente
- Se não encontrar execução ativa, verificar se há mensagens pendentes órfãs e criar execução + vincular
- Auto-complete: se todos itens da execução foram processados, marcar como `completed`

## Fluxo Resultante

```text
Cron 18h (BRT) dispara daily-bi-whatsapp
  ↓
Gera mensagens + cria execução (colunas corretas)
  ↓
Agente checa execution_status (a cada minuto)
  ↓
Se execução existe → processa normalmente
Se execução existe mas sem itens → auto-link órfãos
Se não existe execução mas há órfãos → auto-cria + auto-link
  ↓
Todos processados → auto-complete
```

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/daily-bi-whatsapp/index.ts` | Alinhar colunas da execução com o padrão do whatsapp-queue |
| `supabase/functions/whatsapp-queue/index.ts` | Auto-link de mensagens órfãs + auto-create de execução + auto-complete |

