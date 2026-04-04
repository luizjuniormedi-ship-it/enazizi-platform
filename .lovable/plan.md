

# Correção do botão "Questões" no Plano de Hoje

## Problema
O botão "Questões" nas revisões pendentes navega para `/dashboard/questions-bank`, que **não existe** como rota. A rota correta (`/dashboard/banco-questoes`) redireciona para `/dashboard/simulados`. Resultado: o usuário clica e nada funciona.

## Correção
Alterar a função `goToQuestions` em `src/pages/DailyPlan.tsx` para navegar diretamente para `/dashboard/simulados` com o contexto de estudo (tema, especialidade), permitindo que o módulo de simulados auto-configure questões do tema.

### Arquivo: `src/pages/DailyPlan.tsx`
- Linha 215: trocar `"/dashboard/questions-bank"` por `"/dashboard/simulados"`

Também corrigir o `StudyBlockActions.tsx` (linha 38) que aponta para `banco-questoes` (redireciona mas perde query params):
- Trocar `"/dashboard/banco-questoes"` por `"/dashboard/simulados"`

## Impacto
- Zero risco — apenas corrige destinos de navegação
- Contexto de estudo (tema/especialidade) já é propagado via `encodeStudyContext`
- Simulados já aceita e auto-configura com esses parâmetros

