

# Atualizar Estatísticas em Tempo Real na Landing Page

## Resumo
A `StatsSection` da página inicial usa valores hardcoded. Precisa usar a mesma função `get_login_stats()` já criada para mostrar dados reais.

## Alteração

### `src/components/landing/StatsSection.tsx`
1. Importar `useState`, `useEffect` e o cliente Supabase
2. Chamar `supabase.rpc("get_login_stats")` ao montar
3. Atualizar os valores de Alunos, Questões e Flashcards dinamicamente (mesma função `formatCount` do Login)
4. Manter "8 Agentes IA" fixo

| Arquivo | Mudança |
|---------|---------|
| `src/components/landing/StatsSection.tsx` | Buscar contagens via RPC e exibir dinamicamente |

