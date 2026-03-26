

# Plano: Corrigir Plano do Dia — respeitar horas diarias configuradas

## Problemas encontrados (verificados no preview)

1. **Tempo duplicado**: `totalMinutes` soma `plan?.total_minutes` (plano IA) + `reviewMinutes` + `initialTopicMinutes`. Como o plano IA já inclui esses mesmos itens, o tempo fica duplicado (7h20min em vez de ~3h20min)

2. **Cards mostram ~20min mas calculo usa 40min**: Os cards de "Estudo Inicial" exibem `~20min` no UI (linhas 663, 737) mas o budget usa `TOPIC_DURATION = 40`. Inconsistencia confunde o aluno

3. **Sem revisoes pendentes, todo o budget (4h) vai para novos temas**: Quando `usedReviewMinutes = 0`, o `topicBudget = 240min`, permitindo 5 temas × 40min = 200min. Isso ultrapassa o 40% desejado (96min) porque a divisao 60/40 so se aplica quando ha revisoes

4. **Plano IA antigo persiste**: O plano gerado anteriormente (`plan_json`) continua salvo no banco e seus minutos sao somados mesmo apos reset do cronograma

## Solucao

### Editar `src/pages/DailyPlan.tsx`

**1. Corrigir calculo do `totalMinutes` (linha 414)**
- Quando existe plano IA (`plan`), usar APENAS `plan.total_minutes` (ja inclui tudo)
- Quando NAO existe plano IA, somar `reviewMinutes + initialTopicMinutes`
```typescript
const totalMinutes = plan 
  ? (plan.total_minutes || 0)
  : reviewMinutes + initialTopicMinutes;
```

**2. Limitar novos temas ao budget real de 40% mesmo sem revisoes**
- Mudar `topicBudget` para sempre usar no maximo 40% do tempo total:
```typescript
const topicBudget = Math.min(
  userDailyMinutes - usedReviewMinutes,
  Math.round(userDailyMinutes * 0.4)
);
```
- Com 4h: topicBudget = min(240, 96) = 96min → ~2 temas de 40min (realizavel)

**3. Alinhar display dos cards com o calculo**
- Trocar `~20min` hardcoded nos cards de temas iniciais por `~40min` (ou usar constante)

**4. Limpar plano IA antigo ao recarregar sem dados**
- No `loadToday`, se `planRes.data` existe mas as datas nao batem com o cronograma atual, ignorar o plano antigo

## Resultado
- Aluno com 4h/dia vera no maximo ~4h de conteudo
- Sem revisoes: ~2 temas novos (96min) + margem para exploracao
- Com revisoes: 60% revisoes + 40% temas novos, tudo dentro do budget
- Barra de tempo mostra valor correto e consistente

## Arquivos
- Editar: `src/pages/DailyPlan.tsx` (4 pontos)

