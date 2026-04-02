

# Corrigir Fluxo Automático WhatsApp: Gerar → Executar → Agente Detecta

## Problema
O `generateMessages` insere mensagens e chama `handleStartDesktopExecution()`, que faz `start_execution` na edge function. Porém, se já houver uma execução ativa (409), o fluxo pode falhar silenciosamente. Além disso, a lógica de `start_execution` pega itens "pending" do dia sem filtrar por `execution_id IS NULL`, podendo conflitar com itens já vinculados.

## Solução
Tornar `start_execution` idempotente e robusto:
- Se já existir execução ativa do dia, **reutilizar** e vincular novos itens
- Garantir que só itens sem `execution_id` sejam vinculados
- Atualizar `total_items` com a contagem real

## Alterações

### 1. Edge Function `whatsapp-queue/index.ts` — action `start_execution`
Modificar a lógica para:
1. Se já houver execução `running`/`paused` do dia → reutilizar (em vez de retornar 409)
2. Filtrar itens pendentes com `execution_id IS NULL` (evitar duplicatas)
3. Recalcular `total_items` somando novos + existentes
4. Retornar a execução (nova ou reutilizada) com status `running`

```text
Antes:  execução ativa? → 409 erro
Depois: execução ativa do dia? → reutilizar, vincular novos itens, retornar OK
        sem execução ativa? → criar nova, vincular itens
```

### 2. Frontend `WhatsAppPanel.tsx` — `generateMessages`
Simplificar o fluxo pós-geração:
- Remover a lógica complexa de retry/stop/restart em `handleStartDesktopExecution`
- Confiar que `start_execution` é idempotente
- Após sucesso, buscar status da execução e atualizar UI

### 3. Frontend `WhatsAppPanel.tsx` — `handleStartDesktopExecution`
Simplificar para apenas chamar `start_execution` e lidar com o resultado, sem tentar parar execuções vazias e re-criar.

## Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-queue/index.ts` | `start_execution` idempotente: reutiliza execução do dia, filtra `execution_id IS NULL` |
| `src/components/admin/WhatsAppPanel.tsx` | Simplificar `handleStartDesktopExecution` para confiar na idempotência |

