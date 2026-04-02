

# Corrigir Fluxo da Mensagem BI das 20h

## Problema
A Edge Function `daily-bi-whatsapp` (cron às 23:00 UTC / 20:00 BRT) gera as mensagens e insere na tabela `whatsapp_message_log` com status `pending`, mas **nunca cria uma execução** em `whatsapp_send_executions`. O agente local não detecta essas mensagens porque ele procura uma execução `running`.

É o mesmo problema que foi corrigido no fluxo manual/matinal -- falta criar e ativar a execução após gerar as mensagens.

Além disso, a função usa `ai-proxy` em vez do gateway Lovable AI (`ai.gateway.lovable.dev`).

## Alteração

### `supabase/functions/daily-bi-whatsapp/index.ts`
Após o loop de geração de mensagens (linha ~175), adicionar:

1. Se `queued > 0`, criar uma execução em `whatsapp_send_executions` com `mode = "auto"`, `status = "running"`, `total_items = queued`
2. Vincular os itens pendentes (sem `execution_id`) à execução criada
3. Registrar log em `whatsapp_execution_logs` e `admin_audit_log`
4. Trocar a chamada de IA de `ai-proxy` para `ai.gateway.lovable.dev` com `LOVABLE_API_KEY`
5. Manter o fix de `e nazizi.com` → `enazizi.com`

```text
Antes:  gera mensagens → insere pending → retorna (agente não detecta)
Depois: gera mensagens → insere pending → cria execução running → vincula itens → agente detecta e envia
```

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/daily-bi-whatsapp/index.ts` | Criar execução `running` após gerar mensagens; migrar para Lovable AI gateway |

