

# Plano: Aumentar limite de flashcards para 10.000

## Problema
A query de flashcards globais em `Flashcards.tsx` usa `.limit(500)`, cortando cards. A query de flashcards próprios não tem limite mas depende do default de 1000 do Supabase.

## Mudança

### `src/pages/Flashcards.tsx` (linha 141-142)
- Remover `.limit(500)` da query de flashcards globais
- Adicionar `.limit(10000)` em ambas as queries (próprios e globais) para consistência com o banco de questões

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Flashcards.tsx` | Aumentar limite de carregamento para 10.000 |

