

# Plano: Corrigir Plano do Dia vazio no dia do upload

## Problema
Apos o upload do cronograma, as revisoes D1 sao agendadas para o dia seguinte. O Plano do Dia fica vazio ate amanha, frustrando o usuario que acabou de configurar tudo.

## Solucao
Duas abordagens complementares:

### 1. Mostrar temas do cronograma como "Estudo Inicial" no dia do upload
- No `DailyPlan.tsx`, alem de buscar revisoes pendentes, buscar tambem `temas_estudados` criados hoje que ainda nao tem nenhuma revisao concluida
- Exibir como secao "Estudo Inicial — Primeiro Contato" com os temas cadastrados hoje
- Cada tema tera os mesmos botoes (Tutor IA, Pomodoro, Flashcards, Questoes)

### 2. Incluir temas do cronograma no prompt do `learning-optimizer`
- Os temas ja sao enviados via `scheduledTopics`, mas quando nao ha revisoes pendentes, a lista fica vazia
- Buscar `temas_estudados` ativos do usuario e enviar como `activeTopics` para a IA considerar na geracao de blocos

## Alteracoes

### Editar `src/pages/DailyPlan.tsx`
- No `useEffect` de carregamento, adicionar query para `temas_estudados` criados hoje (`created_at >= today`)
- Renderizar secao "Temas de Hoje" quando existem temas novos mas nenhuma revisao pendente
- Na funcao `generatePlan`, enviar `activeTopics` (temas sem revisao pendente) junto com `scheduledTopics`

## Arquivos
- Editar: `src/pages/DailyPlan.tsx`

