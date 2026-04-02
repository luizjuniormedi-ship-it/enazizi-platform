

# Aumentar Mínimo de Caracteres para Questões

## Problema
O limite atual de 120 caracteres é baixo demais — permite que questões truncadas ou fragmentadas passem pelo filtro. Uma questão médica de qualidade (caso clínico) raramente tem menos de 200-250 caracteres.

## Solução
Subir o mínimo de **120 → 250 caracteres** em todos os pontos de validação, garantindo consistência.

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/_shared/question-filters.ts` | `isValidQuestion`: adicionar check `q.statement.length < 250`; `hasMinimumContext`: já usa 200, subir para 250 |
| `supabase/functions/professor-simulado/index.ts` | Alterar `s.length < 120` → `s.length < 250` no filtro de qualidade |
| `supabase/functions/ingest-questions/index.ts` | Alterar `statement.length < 120` → `250` e `block.length < 120` → `250` |
| `supabase/functions/search-real-questions/index.ts` | Alterar `stmt.length < 120` → `250` |

Todas as edge functions afetadas serão re-deployadas.

