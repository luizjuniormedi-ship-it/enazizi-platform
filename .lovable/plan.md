

# Plano: Ranking Semanal sempre visivel com fallback para XP total

## Problema
O ranking semanal (`MiniLeaderboard` e pagina `Achievements`) so mostra dados quando `weekly_xp > 0`. Se nenhum usuario tem XP semanal (apos reset ou inicio), o ranking fica vazio/invisivel — sem referencia nenhuma.

## Alteracoes

### 1. `src/components/dashboard/MiniLeaderboard.tsx`
- Remover o `if (ranking.length === 0) return null` — sempre renderizar o componente
- Adicionar fallback: se todos tem `weekly_xp = 0`, fazer segunda query ordenando por `xp` total
- Mostrar label dinamico: "Ranking Semanal" quando ha XP semanal, "Ranking Geral" como fallback
- Exibir mensagem "Comece a estudar para aparecer no ranking!" se realmente nao ha dados

### 2. `src/pages/Achievements.tsx`
- Mesma logica de fallback: se `weekly_xp` de todos e 0, ordenar por `xp` total
- Mostrar label indicando qual ranking esta sendo exibido

### 3. Reset semanal do `weekly_xp`
- Verificar se o campo `weekly_reset_at` esta sendo usado — atualmente o hook `useGamification` incrementa `weekly_xp` mas nunca reseta
- Adicionar logica no `addXp`: se `weekly_reset_at < now()`, zerar `weekly_xp` antes de somar e atualizar `weekly_reset_at` para proximo reset (proxima segunda)

## Arquivos
- `src/components/dashboard/MiniLeaderboard.tsx`
- `src/pages/Achievements.tsx`
- `src/hooks/useGamification.ts`

