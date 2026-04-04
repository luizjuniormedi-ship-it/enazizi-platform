

# Metas Semanais com Carryover de Pendências

## Problema Atual
O `useWeeklyGoals` recalcula metas do zero toda segunda-feira. Se o usuário não cumpriu metas na semana anterior, elas desaparecem sem impacto — exceto revisões FSRS que naturalmente persistem no banco.

## Solução
Adicionar lógica de carryover proporcional: ao calcular as metas da nova semana, verificar o progresso da semana anterior e incorporar uma fração do que não foi cumprido.

## Lógica de Carryover

1. Ao calcular metas da semana atual, buscar também o progresso da **semana anterior** (segunda anterior - domingo anterior)
2. Para cada meta não cumprida 100%, adicionar **50% do deficit** à meta da nova semana (para não sobrecarregar)
3. Cap máximo: meta nunca excede 1.5x o valor base calculado

Exemplo:
- Semana passada: meta 210 questões, fez 140 → deficit 70 → carryover +35
- Semana atual: meta base 210 → meta final 245

## Mudanças Técnicas

| Arquivo | Ação |
|---------|------|
| `src/hooks/useWeeklyGoals.ts` | Adicionar `fetchPreviousWeekProgress()`, calcular deficit e somar carryover proporcional às metas |

### Detalhes da implementação

No `useWeeklyGoals.ts`:
- Criar função `getPreviousMonday()` que retorna a segunda-feira da semana anterior
- Reutilizar `fetchWeeklyProgress()` com a data da semana anterior
- Calcular `carryover = Math.round(Math.max(0, target - actual) * 0.5)` para cada meta
- Aplicar cap: `Math.min(baseTarget + carryover, Math.round(baseTarget * 1.5))`
- Exibir indicador visual no card quando houver carryover (ex: "+35 da semana anterior")

### No `WeeklyGoalsCard.tsx`:
- Se houver carryover > 0, mostrar badge discreto: "inclui pendência anterior"

## O que NÃO muda
- Study Engine, FSRS, missão, cronograma
- Nenhuma tabela nova
- Lógica de zonas e adaptação por prova mantida

