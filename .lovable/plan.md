
# Fallback com Retry + Banco na Geração de Questões do Professor

## Problema
Quando a IA falha (JSON malformado, timeout, resposta vazia), o `generate_questions` lança erro e o professor fica sem questões. Não há fallback nem retry.

## Solução

### 1. Edge Function `professor-simulado/index.ts` — case `generate_questions`

**Retry com fallback ao banco de questões:**

```text
Fluxo atual:
  AI call → parse JSON → return questions (ou throw Error)

Fluxo novo:
  Tentativa 1: AI call → parse JSON
  Se falhar → Tentativa 2: AI call (retry)
  Se falhar → Fallback: buscar questões do questions_bank por topic
  Retorna o que conseguiu (parcial é melhor que erro)
```

Mudanças específicas:
- Envolver a chamada AI + parse em `try/catch` com **1 retry automático**
- Se ambas tentativas falharem, fazer fallback ao `questions_bank`:
  ```sql
  SELECT * FROM questions_bank 
  WHERE topic IN (topics) 
  AND review_status = 'approved' 
  AND is_global = true
  ORDER BY random() 
  LIMIT count
  ```
- Mapear as colunas do banco para o formato esperado (`statement`, `options`, `correct_index`, `explanation`, `topic`, `block`)
- Retornar `{ questions, source: "ai" | "bank" | "mixed" }` para o frontend saber a origem
- Se JSON.parse falhar, tentar sanitizar (remover trailing commas, fix encoding) antes de desistir

### 2. Frontend `src/pages/ProfessorDashboard.tsx`

- No `generateQuestionsAI`, quando um batch retorna 0 questões, **não parar** — continuar para o próximo batch
- Mostrar toast informativo quando questões vieram do banco: "Algumas questões foram obtidas do banco existente"
- No final, se `allQuestions.length === 0`, mostrar mensagem clara em vez de erro genérico

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/professor-simulado/index.ts` | Retry + fallback ao questions_bank no case `generate_questions` |
| `src/pages/ProfessorDashboard.tsx` | Tolerância a batches vazios; toast informativo sobre origem |
