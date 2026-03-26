

# Plano: Melhorar prompt do generate-study-plan com revisão espaçada

## Situação atual
O `generate-study-plan` gera um `weeklySchedule` com blocos genéricos (estudo, revisao, questoes, simulado), mas **não inclui instruções de revisão espaçada** (D1, D7, D30). As revisões são criadas apenas no frontend (`CronogramaInteligente.tsx`) após salvar os temas.

O `learning-optimizer` (que gera o Plano do Dia) já recebe os temas agendados e revisões pendentes, mas depende do frontend para saber quais revisões existem.

## Melhoria proposta

### Editar `supabase/functions/generate-study-plan/index.ts`

**Adicionar ao prompt instruções de revisão espaçada no weeklySchedule:**

1. Após listar os temas na Semana 1, a IA deve programar blocos de revisão D1 (dia seguinte), D7 e D30 automaticamente nas semanas seguintes
2. Adicionar campo `"reviewSchedule"` ao JSON de saída com o mapa de revisões planejadas por tema
3. Incluir no prompt:
   - "Para cada tema estudado, agende revisões espaçadas: D1 (1 dia após), D7 (7 dias após), D30 (30 dias após)"
   - "Blocos de revisão devem ter type: 'revisao' e duration: '30min'"
   - "Distribua revisões nos dias disponíveis sem ultrapassar o limite de horas/dia"

**Novo campo no JSON de saída:**
```json
{
  "reviewSchedule": [
    { "topic": "Bronquiolite", "d1": "Ter", "d7": "Seg (semana 2)", "d30": "Seg (semana 5)" }
  ]
}
```

4. Adicionar regra: "O total de horas por dia (estudo + revisão + questões) NÃO pode ultrapassar ${hoursPerDay}h"

### Resultado
- O plano gerado pela IA já vem com revisões espaçadas embutidas
- O frontend pode usar `reviewSchedule` para criar as entradas na tabela `revisoes` com datas corretas
- O Plano do Dia recebe blocos de revisão consistentes com o cronograma

### Arquivo
- Editar: `supabase/functions/generate-study-plan/index.ts` (prompt + schema do JSON)

