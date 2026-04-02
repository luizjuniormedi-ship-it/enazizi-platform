

# Corrigir Cálculo de Percentual nos Simulados do BI Diário

## Problema
Na linha 152 do `daily-bi-whatsapp`, o cálculo faz `(score / total_questions) * 100`. Porém, o campo `score` na tabela `teacher_simulado_results` **já armazena um percentual** (ex: 68 = 68%). O código trata como número de acertos e divide por `total_questions` novamente, gerando valores como 227%.

**Dados do Fábio**: `score = 68`, `total_questions = 30` → `(68/30)*100 = 226.7% ≈ 227%`

## Solução

### 1. Corrigir o cálculo — usar `score` direto como percentual

**Arquivo**: `supabase/functions/daily-bi-whatsapp/index.ts` (linhas 148-154)

Trocar:
```typescript
const avgScore = done.length > 0
  ? Math.round(done.reduce((sum, r) => sum + ((r.score || 0) / (r.total_questions || 1) * 100), 0) / done.length)
  : 0;
```

Por:
```typescript
const avgScore = done.length > 0
  ? Math.min(100, Math.round(done.reduce((sum, r) => sum + (r.score || 0), 0) / done.length))
  : 0;
```

### 2. Adicionar `Math.min(100, ...)` como proteção extra em todos os percentuais

Aplicar clamp de 0-100 em:
- Linha 75: `accuracy` (questões do dia) — já está correto, mas adicionar `Math.min(100, ...)`
- Linha 152: `avgScore` dos simulados — **bug principal**
- Qualquer outro percentual passado ao prompt

### 3. Adicionar instrução explícita ao prompt da IA

No prompt (linha 179), adicionar regra:
```
REGRAS IMPORTANTES:
- NUNCA mostre percentuais acima de 100%. Valores são de 0% a 100%.
- NÃO invente dados ou métricas que não foram fornecidos.
- NÃO calcule "probabilidade de aprovação" — apenas relate os dados fornecidos.
```

Isso impede a IA de inventar métricas ou somar percentuais de forma incorreta.

## Mudanças

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/daily-bi-whatsapp/index.ts` | Corrigir cálculo de `avgScore` (usar score direto); adicionar clamp 0-100; adicionar regras ao prompt da IA |

