

# Metas Semanais Inteligentes — Plano de Implementação

## Abordagem

Criar um hook `useWeeklyGoals` que calcula metas personalizadas a partir dos mesmos dados já disponíveis (`usePreparationIndex`, `useDashboardData`) e um card `WeeklyGoalsCard` no Dashboard. Sem tabelas novas — as metas são calculadas dinamicamente a cada semana com base no estado real.

## Lógica de Cálculo das Metas

O hook determina 4 metas semanais baseadas no perfil:

| Meta | Base de cálculo | Adaptação |
|------|-----------------|-----------|
| **Questões** | `meta_questoes_dia × 7` do `cronograma_config`, ou 30×7=210 default | zona forte: +20%, base fraca: -30% |
| **Revisões** | `pendingRevisoes` atual + buffer proporcional | prova próxima (<30d): +50% |
| **Temas novos** | 3-7 baseado em coverage do cronograma | coverage >80%: reduz para 2 |
| **Prática clínica** | 1-4 sessões (plantão/OSCE/anamnese) | zona competitiva+: aumenta |

Progresso calculado a partir de dados da semana atual (segunda a domingo):
- `practice_attempts` com `created_at >= segunda`
- `revisoes` concluídas na semana
- `temas_estudados` na semana
- `simulation_sessions` + `anamnesis_results` + `chronicle_osce_sessions` na semana

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useWeeklyGoals.ts` | **Criar** — hook com cálculo adaptativo das 4 metas + progresso |
| `src/components/dashboard/WeeklyGoalsCard.tsx` | **Criar** — card com lista de metas, barra de progresso cada, mensagem motivacional |
| `src/pages/Dashboard.tsx` | **Editar** — adicionar `WeeklyGoalsCard` abaixo do `WeeklyEvolutionBar` |

## Hook `useWeeklyGoals`

- Consome `usePreparationIndex` (zona, breakdown) e `useDashboardData` (metrics, stats)
- Faz 4 queries para progresso da semana atual (paralelo)
- Calcula metas com base na zona + proximidade da prova + breakdown
- Gera mensagem motivacional dinâmica
- `staleTime: 60s`, `refetchOnWindowFocus: true`

## Card `WeeklyGoalsCard`

- Título: "🎯 Meta da semana"
- 4 linhas: ícone + label + barra de progresso + "X/Y"
- Progresso geral (%) no topo
- Mensagem motivacional abaixo
- Cores: verde (≥100%), amarelo (50-99%), vermelho (<50%)
- Compacto, sem ocupar mais de ~200px de altura

## Integração com Índice de Preparação

O `usePreparationIndex` já considera volume de questões, revisões e prática. As metas semanais são calculadas para guiar o usuário a melhorar esses sub-scores, mas não alteram diretamente o cálculo do índice — o índice reflete resultados reais, as metas são orientação.

## Reset Semanal

Automático — o hook calcula a segunda-feira da semana atual e busca dados apenas daquela janela. Nova semana = metas recalculadas automaticamente.

## O que NÃO muda
- Study Engine, FSRS, cronograma, missão
- Nenhuma tabela nova necessária
- Nenhum dado mockado — tudo vem de queries reais

