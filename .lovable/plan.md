

# Plano: Integrar Cronograma Inteligente ao Plano do Dia

## Problema
O "Plano do Dia" (`DailyPlan.tsx`) gera blocos de estudo via edge function `learning-optimizer` mas ignora completamente os temas e revisoes cadastrados no Cronograma Inteligente (`temas_estudados`, `revisoes`). O usuario faz upload do edital, gera o cronograma, mas o Plano do Dia nao reflete essas atividades.

## Solucao
Alterar o `DailyPlan.tsx` para buscar as revisoes pendentes de hoje e os temas do cronograma, e inclui-los como blocos no plano do dia — tanto no plano gerado pela IA quanto como fallback quando nao ha plano gerado.

## Alteracoes

### 1. Editar `src/pages/DailyPlan.tsx`
- No `useEffect` de carregamento, alem de buscar `daily_plans`, buscar tambem:
  - `revisoes` pendentes de hoje e atrasadas (do usuario)
  - `temas_estudados` ativos (para exibir nome/especialidade)
- Exibir uma secao "Atividades do Cronograma" abaixo do plano IA (ou como conteudo principal se nao houver plano gerado)
- Cada revisao pendente vira um card com: tema, tipo_revisao (D1/D3/D7...), especialidade, e botoes de acao (Tutor IA, Flashcards, Questoes)
- Na funcao `generatePlan`, enviar os temas do cronograma e revisoes pendentes para o `learning-optimizer` para que a IA inclua esses temas nos blocos

### 2. Editar `supabase/functions/learning-optimizer/index.ts`
- Aceitar novo campo `scheduledTopics` no body (lista de temas com tipo de revisao)
- Incluir esses temas obrigatoriamente nos blocos gerados, priorizando revisoes atrasadas

## Resultado
- O Plano do Dia mostra automaticamente as revisoes agendadas pelo cronograma
- A IA incorpora os temas do edital nos blocos de estudo
- O usuario tem uma visao unificada de tudo que precisa fazer no dia

## Arquivos
- Editar: `src/pages/DailyPlan.tsx`
- Editar: `supabase/functions/learning-optimizer/index.ts`

