

# Plano: Dashboard Limpo com Navegacao Drill-Down

## Problema atual
O dashboard mostra tudo de uma vez: saudacao, XP, banners, alertas, termometro, KPIs, graficos, leaderboard, etc. Sao ~15 widgets empilhados, gerando sobrecarga visual.

## Conceito
Transformar o dashboard em uma tela resumida com **5 cards principais** clicaveis. Ao clicar em qualquer card, ele expande/navega para uma tela detalhada.

## Estrutura da tela principal (resumo)

```text
┌─────────────────────────────────┐
│ Saudacao + XP (compacto)        │
├─────────────────────────────────┤
│ Termometro de Aprovacao (topo)  │
├────────────────┬────────────────┤
│ Desempenho     │ Cronograma     │
│ 72% acerto     │ 3 revisoes     │
│ 150 questoes   │ 5/12 tarefas   │
├────────────────┼────────────────┤
│ Streak & Metas │ Simulados      │
│ 🔥 7 dias      │ 4 feitos       │
│ Meta: 80%      │ Media: 68%     │
├────────────────┴────────────────┤
│ Recomendacoes Inteligentes      │
└─────────────────────────────────┘
```

Cada card e clicavel e abre uma **secao expandida** (Sheet/Dialog ou sub-rota) com os detalhes completos.

## Alteracoes

### 1. Novo componente `DashboardSummaryCard.tsx`
- Card reutilizavel com: icone, titulo, 2-3 metricas resumidas, seta de "ver mais"
- Ao clicar, abre um `Sheet` (drawer lateral/inferior) com o conteudo detalhado
- Usa o pattern de Sheet do shadcn ja existente no projeto

### 2. Refatorar `Dashboard.tsx`
- **Manter no topo** (sempre visiveis): Saudacao compacta, XP, banners de sistema, Termometro
- **Agrupar em 4 cards resumo**:
  - **Desempenho**: Questoes respondidas, taxa de acerto, erros → ao abrir mostra DashboardCharts + SpecialtyProgressCard + TopicEvolution
  - **Cronograma & Revisoes**: Tarefas, revisoes pendentes, plano do dia → ao abrir mostra DailyPlanWidget + DailyGoalWidget
  - **Streak & Gamificacao**: Streak, nivel, conquistas → ao abrir mostra StreakCalendar + WeeklyProgressCard + MiniLeaderboard
  - **Simulados & Pratica**: Simulados feitos, discursivas, plantoes → ao abrir mostra DashboardMetricsGrid completo + SpecialtyBenchmark
- **Manter embaixo**: SmartRecommendations (compacto, 2-3 sugestoes)
- Remover widgets que ja estao acessiveis via sidebar (ErrorReviewCard, SmartNotifications ficam como notificacoes)

### 3. Manter comportamento para novos usuarios
- QuickStartCard e OnboardingChecklist continuam aparecendo normalmente para `isNewUser`

## Detalhes tecnicos
- Usar `Sheet` do shadcn (ja existe em `src/components/ui/sheet.tsx`) para os paineis detalhados
- Os componentes existentes (StreakCalendar, DashboardCharts, etc) nao mudam — so movem para dentro dos Sheets
- Estado `openSection: string | null` controla qual Sheet esta aberto
- Mobile: Sheet abre de baixo (side="bottom"); Desktop: abre da direita (side="right")

## Arquivos
- Criar: `src/components/dashboard/DashboardSummaryCard.tsx`
- Modificar: `src/pages/Dashboard.tsx`
- Sem mudancas nos componentes filhos existentes

