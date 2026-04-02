

# Unificar Filtro de 400 Caracteres em Todos os Geradores

## Resumo
Aplicar o mínimo de 400 caracteres (padrão ENAMED) e prompt de caso clínico completo nos 6 geradores restantes que ainda não foram atualizados.

## Mudanças por Arquivo

### 1. `supabase/functions/daily-question-generator/index.ts`
- **Linha 158**: Prompt `searchRealQuestionsViaAI` — `≥250` → `≥400` caracteres
- **Linha 174**: JSON format example — `≥250` → `≥400`
- **Linha 222**: Filtro `s.length >= 250` → `s.length >= 400`
- **Linha 290**: Prompt `generateForSpecialty` — remover `150 caracteres`, colocar `400 caracteres`
- **Linha 313**: JSON format example — `≥150` → `≥400`
- **Linha 358**: Filtro `s.length >= 150` → `s.length >= 400`

### 2. `supabase/functions/bulk-generate-content/index.ts`
- **Linha 350-354**: Adicionar filtro `String(q.statement).trim().length >= 400` no `.filter()` das questões (atualmente sem filtro de tamanho)

### 3. `supabase/functions/populate-questions/index.ts`
- **Linha 119-122**: Adicionar `String(q.statement).trim().length >= 400` no `.filter()` das questões (atualmente sem filtro de tamanho)

### 4. `supabase/functions/question-generator/index.ts`
- **Linha 38**: Prompt JSON — `Mínimo 250 caracteres` → `Mínimo 400 caracteres`
- `isValidQuestion` e `hasMinimumContext` do shared já usam 400, então o filtro server-side (linha 417-418) já está correto

### 5. `supabase/functions/extract-exam-questions/index.ts`
- **Linha 196-197**: Adicionar `q.statement.length >= 400` no filtro de `newQuestions` (extrações de provas reais — manter 400 apenas para consistência, mas questões reais geralmente são longas)

### 6. `supabase/functions/extract-exam-visual/index.ts`
- **Linha 208**: `q.statement.length < 30` → `q.statement.length < 400`

### Deploy
Re-deploy das 6 edge functions.

| Arquivo | Mudança Principal |
|---------|-------------------|
| `daily-question-generator` | 250/150 → 400 em prompts e filtros |
| `bulk-generate-content` | Adicionar filtro `length >= 400` |
| `populate-questions` | Adicionar filtro `length >= 400` |
| `question-generator` | Prompt 250 → 400 |
| `extract-exam-questions` | Adicionar filtro `length >= 400` |
| `extract-exam-visual` | 30 → 400 |

