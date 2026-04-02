

# Corrigir Gerador de Simulado (100 questões + notificação)

## Problemas Identificados

### 1. Timeout na geração de 100 questões
A Edge Function faz **uma única chamada de IA** para gerar todas as questões. Com 100 questões, a IA precisa de muito mais tempo e tokens do que o timeout permite (45s default, max 150s do edge function). O `max_tokens` está fixo em 16384, insuficiente para 100 questões completas com caso clínico.

### 2. Notificação in-app funciona, mas sem WhatsApp
O `create_simulado` insere notificações na tabela `admin_messages` (in-app), mas não dispara mensagem WhatsApp para os alunos atribuídos.

## Solução

### Alteração 1: Edge Function `professor-simulado/index.ts` — geração em lotes
Na action `generate_questions`:
- Dividir a geração em **lotes de no máximo 20 questões** por chamada de IA
- Para 100 questões: 5 chamadas sequenciais de 20 cada
- Aumentar `max_tokens` para 32768 no `aiFetch` (via parâmetro ou override)
- Aumentar `timeoutMs` para 90s por lote
- Concatenar os resultados e retornar o array completo
- Distribuir temas proporcionalmente entre os lotes

```text
Antes:  1 chamada → 100 questões → timeout
Depois: 5 chamadas × 20 questões → concatenar → sucesso
```

### Alteração 2: `_shared/ai-fetch.ts` — suportar max_tokens customizável
Adicionar parâmetro opcional `maxTokens` na interface `AiFetchOptions` para permitir que funções solicitem mais tokens quando necessário.

### Alteração 3: Edge Function `professor-simulado/index.ts` — notificação WhatsApp
Na action `create_simulado`, após inserir as notificações in-app:
- Para cada aluno com `phone` cadastrado e `whatsapp_opt_out = false`:
  - Inserir na tabela `whatsapp_message_log` uma mensagem informando sobre o novo simulado
- Criar uma execução em `whatsapp_send_executions` para que o agente local envie

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/_shared/ai-fetch.ts` | Adicionar `maxTokens` opcional à interface |
| `supabase/functions/professor-simulado/index.ts` | Geração em lotes de 20; notificação WhatsApp após criar simulado |

