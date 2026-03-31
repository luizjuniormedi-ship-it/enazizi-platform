

# Fix: Questões sem Contexto e em Inglês

## Causa Raiz

1. **Questões em inglês**: O filtro `ENGLISH_PATTERN` existe em `_shared/question-filters.ts` mas **não é usado** na edge function `question-generator`. A IA às vezes gera em inglês e nada filtra.

2. **Questões sem contexto**: O filtro de qualidade no frontend (`mapQuestions` em Simulados.tsx) verifica `statement.length >= 200` e exige padrão de idade — mas o **QuestionGenerator.tsx** usa streaming e não aplica nenhum filtro de qualidade no conteúdo recebido.

3. **Prompt insuficiente no JSON mode**: O `jsonSystemPrompt` da edge function não tem enforcement forte o suficiente contra inglês.

## Mudanças

### 1. Edge Function `question-generator/index.ts` — Filtrar no servidor

- Importar `isValidQuestion`, `ENGLISH_PATTERN` de `_shared/question-filters.ts`
- No modo JSON (tool calling), após parsear as questões, aplicar `isValidQuestion()` + verificar `statement.length >= 200` antes de retornar
- Adicionar filtro extra: rejeitar questões onde >30% das palavras são em inglês
- Reforçar no prompt: "VIOLAÇÃO GRAVE: qualquer questão em inglês será descartada automaticamente"

### 2. `_shared/question-filters.ts` — Expandir filtros

- Adicionar `hasMinimumContext()`: verifica se statement tem >= 200 chars e contém padrão de idade/tempo (`\d+\s*(anos?|meses|dias|horas)`)
- Expandir `ENGLISH_PATTERN` com mais termos comuns: `diagnosis`, `management`, `regarding`, `concerning`, `history of`

### 3. `src/pages/QuestionGenerator.tsx` — Filtro pós-streaming

- Na função `handleSaveQuestions`, após `parseQuestionsFromText`, aplicar filtro: rejeitar questões com `statement.length < 150` ou que casem com `ENGLISH_PATTERN`
- Mostrar toast avisando quantas questões foram descartadas por baixa qualidade

### 4. `src/pages/Simulados.tsx` — Reforçar filtro existente

- Adicionar verificação de inglês no `mapQuestions`: `!/\b(the patient|which of the following|presents with)\b/i.test(q.statement)`

### Arquivos Impactados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/_shared/question-filters.ts` | Expandir ENGLISH_PATTERN, adicionar `hasMinimumContext()` |
| `supabase/functions/question-generator/index.ts` | Importar e aplicar filtros no response JSON |
| `src/pages/QuestionGenerator.tsx` | Filtro de qualidade no `handleSaveQuestions` |
| `src/pages/Simulados.tsx` | Adicionar filtro anti-inglês no `mapQuestions` |

