

## Plano: OpenAI prioritária no Tutor + Fallback OpenAI nos demais agentes

### Situação atual

O `ai-fetch.ts` compartilhado **já implementa** o fallback para OpenAI quando o Lovable AI falha (402/429). Todos os agentes que usam `aiFetch()` já têm essa proteção. A chave `OPENAI_API_KEY` já está configurada como secret.

### O que precisa mudar

Apenas o **chatgpt-agent** precisa ser alterado para priorizar OpenAI (GPT-4o) diretamente, com Lovable AI como fallback.

### Alteração: `supabase/functions/chatgpt-agent/index.ts`

- Remover import do `aiFetch`
- Chamar OpenAI API diretamente com `gpt-4o` e `stream: true`
- Se OpenAI retornar 429/402/erro, fazer fallback para Lovable AI Gateway com `google/gemini-2.5-pro`
- Manter toda a lógica de prompt (ENAZIZI, progress, error_bank) inalterada
- Manter tratamento de erros 402/429 para o usuário final

### Resumo

| Agente | Prioridade | Fallback |
|--------|-----------|----------|
| Tutor IA (chatgpt-agent) | OpenAI GPT-4o | Lovable AI (Gemini 2.5 Pro) |
| Todos os demais (11 agentes) | Lovable AI | OpenAI GPT-4o/mini (já funciona via ai-fetch.ts) |

Nenhuma outra alteração necessária — o fallback para os demais já está implementado.

