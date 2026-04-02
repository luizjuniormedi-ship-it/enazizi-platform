

# Equiparar Questões IA ao Padrão ENAMED (400-600 caracteres)

## Problema
As questões geradas pela IA têm enunciados curtos (~250-350 chars) enquanto questões reais de provas ENAMED/ENARE têm entre 400-800 caracteres com caso clínico completo (anamnese, exame físico, exames complementares, pergunta final).

## Solução
Reforçar no prompt da IA a exigência de enunciados longos no padrão ENAMED e subir o filtro mínimo de 250 → 400 caracteres.

## Mudanças

### 1. `supabase/functions/professor-simulado/index.ts`

**No prompt (linha ~160-199):**
Adicionar regra explícita de tamanho mínimo:
```
TAMANHO MÍNIMO OBRIGATÓRIO DO ENUNCIADO: cada enunciado deve ter NO MÍNIMO 400 caracteres.
Siga o padrão ENAMED/ENARE com caso clínico completo contendo:
1. Identificação do paciente (nome fictício, idade, sexo, profissão)
2. Queixa principal e história da doença atual (tempo de evolução, sintomas)  
3. Antecedentes (comorbidades, medicações, hábitos)
4. Exame físico relevante (sinais vitais, achados)
5. Exames complementares quando pertinente (laboratoriais, imagem)
6. Pergunta objetiva final
```

**No filtro de qualidade (linha ~377-384):**
Subir `s.length < 250` → `s.length < 400`

### 2. `supabase/functions/_shared/question-filters.ts`
Subir `isValidQuestion` e `hasMinimumContext` de 250 → 400 caracteres para consistência global.

### 3. `supabase/functions/ingest-questions/index.ts` e `search-real-questions/index.ts`
Subir filtros de 250 → 400 caracteres.

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/professor-simulado/index.ts` | Prompt com regra de 400 chars + estrutura ENAMED; filtro 250→400 |
| `supabase/functions/_shared/question-filters.ts` | Mínimo global 250→400 |
| `supabase/functions/ingest-questions/index.ts` | Filtro 250→400 |
| `supabase/functions/search-real-questions/index.ts` | Filtro 250→400 |

