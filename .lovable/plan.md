

# Reset de Fila WhatsApp — Limpeza Automática de Mensagens Não Enviadas

## Problema
Quando o disparo WhatsApp falha ou não é executado, as mensagens pendentes ficam presas na fila (`whatsapp_message_log` com `delivery_status = 'pending'` ou `'processing'`) e a execução fica em estado `running`/`paused` indefinidamente, bloqueando o próximo ciclo.

## Solução

### 1. Nova action `reset_queue` na Edge Function `whatsapp-queue`
Adicionar uma action que:
- Cancela todas as mensagens pendentes/processing do dia atual (ou de uma execução específica)
- Marca a execução ativa como `stopped` com `finished_at`
- Registra log de auditoria (`execution_reset`)
- Retorna contagem de itens cancelados

### 2. Botão "Reset / Limpar Fila" no `WhatsAppPanel.tsx`
- Adicionar botão visível na aba "Execução Desktop" quando há execução ativa com itens pendentes
- Confirmação antes de executar (window.confirm)
- Limpa estado local (`activeExecution`, `executionItems`, `students`)
- Toast de confirmação

### 3. Auto-reset de execuções antigas (self-healing)
Na action `execution_status` existente, adicionar lógica:
- Se a execução ativa tem mais de 6 horas sem progresso, marcar automaticamente como `stopped` e cancelar pendentes
- Isso garante que execuções "fantasmas" não bloqueiem o próximo ciclo

## Arquivos
- **Editado**: `supabase/functions/whatsapp-queue/index.ts` — nova action `reset_queue` + auto-reset de execuções antigas
- **Editado**: `src/components/admin/WhatsAppPanel.tsx` — botão de reset + handler

## Impacto
- Zero risco para mensagens já enviadas (só afeta `pending`/`processing`)
- Libera o sistema para o próximo ciclo de geração
- Self-healing impede acúmulo de filas fantasmas

