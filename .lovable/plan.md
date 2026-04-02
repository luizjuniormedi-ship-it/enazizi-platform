

# Corrigir max_tokens no Fallback OpenAI

## Problema
Quando o Lovable AI retorna 402 (sem créditos), o fallback OpenAI falha porque `max_tokens: 32768` excede o limite do `gpt-4o-mini` (16384). Resultado: 0 questões da IA → só ~40 do banco.

## Correções

### 1. `supabase/functions/_shared/ai-fetch.ts`
Adicionar mapa de limites por modelo OpenAI e aplicar `Math.min` no `buildBody` quando for fallback:

```typescript
const OPENAI_MAX_TOKENS: Record<string, number> = {
  "gpt-4o-mini": 16384,
  "gpt-4o": 16384,
};
```

No trecho do fallback OpenAI, limitar: `max_tokens = Math.min(requestedTokens, OPENAI_MAX_TOKENS[model] || 16384)`

### 2. `supabase/functions/professor-simulado/index.ts`
Reduzir `maxTokens` de 32768 para 16384 na chamada `aiFetch` do `generate_questions` — 16384 tokens é suficiente para 25 questões por batch.

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/_shared/ai-fetch.ts` | Limitar max_tokens ao máximo do modelo OpenAI no fallback |
| `supabase/functions/professor-simulado/index.ts` | Reduzir maxTokens de 32768 para 16384 |

