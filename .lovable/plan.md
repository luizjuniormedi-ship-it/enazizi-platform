

# Resultado do Teste de Simulado + Notificações

## O que foi testado

1. **Geração de questões**: ✅ Funciona para lotes pequenos (3-5 questões). Para lotes maiores, a IA pode retornar JSON malformado (erro de parse já observado nos logs).

2. **Criação do simulado**: ✅ Simulado "Teste Cardiologia" criado com sucesso para Luiz Junior.

3. **Notificação na plataforma (admin_messages)**: ✅ Criada corretamente com prioridade "important".

4. **Mensagem WhatsApp**: ⚠️ A mensagem foi inserida na tabela `whatsapp_message_log` com status `pending`, porém a **execução NÃO foi criada** — o agente local não vai detectar.

## Bug encontrado: Execução WhatsApp não é criada

O código na `professor-simulado` (linha 224) tenta inserir uma execução com colunas que **não existem** na tabela `whatsapp_send_executions`:

```text
Código usa          →  Tabela espera
─────────────────────────────────────
started_by          →  admin_user_id (NOT NULL)
sent_count          →  total_sent
error_count         →  total_error
source              →  (não existe)
```

O insert falha silenciosamente (está dentro de try/catch), a mensagem fica pendente sem execução, e o agente nunca a processa.

## Correção necessária

### `supabase/functions/professor-simulado/index.ts` (linhas 224-231)

Corrigir os nomes das colunas para corresponder ao schema real:

```typescript
const { data: exec } = await sb.from("whatsapp_send_executions").insert({
  admin_user_id: user.id,
  execution_date: new Date().toISOString().slice(0, 10),
  mode: "auto",
  status: "running",
  total_items: eligibleStudents.length,
  total_sent: 0,
  total_error: 0,
  total_skipped: 0,
  started_at: new Date().toISOString(),
}).select("id").single();
```

### JSON parse resiliente (bônus)

Adicionar retry com sanitização quando `JSON.parse` falhar na geração de questões (remover trailing commas, caracteres inválidos).

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/professor-simulado/index.ts` | Corrigir nomes das colunas na criação de execução WhatsApp; adicionar sanitização de JSON |

