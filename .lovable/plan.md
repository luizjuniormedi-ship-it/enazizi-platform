

# Anti-repetição de Questões na Geração em Lotes

## Problema
Quando simulados são gerados em múltiplos lotes (ex: 100 questões = 4 lotes de 25), cada lote é enviado à IA de forma independente, sem contexto das questões já geradas. Isso causa questões repetidas ou muito similares entre lotes.

**Painel Professor**: lotes sequenciais sem passar contexto dos anteriores.
**Simulado Normal**: lotes paralelos via `Promise.allSettled` — impossível evitar duplicação durante a geração. A deduplicação pós-geração (`deduplicateQuestions`) só compara os primeiros 80 caracteres.

## Solução

### 1. `src/pages/ProfessorDashboard.tsx` — Passar resumo dos lotes anteriores
- Após cada lote, coletar os tópicos/enunciados curtos das questões já geradas
- Enviar no próximo request um campo `previousStatements` com os primeiros 100 caracteres de cada questão já gerada
- A edge function injeta isso no prompt como "questões já geradas, NÃO repita"

### 2. `supabase/functions/professor-simulado/index.ts` — Receber e usar anti-repetição
- Aceitar campo `previousStatements` (array de strings)
- Adicionar ao prompt: "QUESTÕES JÁ GERADAS (NÃO REPITA): [lista]"
- Adicionar deduplicação pós-parse (fuzzy match 80 chars) removendo questões repetidas do lote

### 3. `src/pages/Simulados.tsx` — Converter batches paralelos em sequenciais + dedup reforçado
- Trocar `Promise.allSettled` por loop sequencial (como no professor)
- Passar `previousStatements` para cada batch via prompt
- Reforçar `deduplicateQuestions` para comparar também similaridade nos primeiros 120 chars (normalizado)

### 4. Edge function `question-generator` — Aceitar contexto anti-repetição
- Receber campo opcional `avoidStatements` no body
- Injetar no prompt instruções para evitar esses enunciados

```text
Lote 1: gera 25 questões → coleta resumos
Lote 2: recebe resumos do lote 1 → gera 25 novas → coleta
Lote 3: recebe resumos dos lotes 1+2 → gera 25 novas → ...
Pós: deduplicação final por fuzzy match
```

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ProfessorDashboard.tsx` | Passar `previousStatements` entre lotes sequenciais |
| `supabase/functions/professor-simulado/index.ts` | Receber e injetar anti-repetição no prompt + dedup pós-parse |
| `src/pages/Simulados.tsx` | Converter batches para sequencial; passar contexto anti-repetição; reforçar dedup |
| `supabase/functions/question-generator/index.ts` | Aceitar `avoidStatements` e injetar no prompt |

