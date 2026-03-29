

# Diagnóstico do Dashboard ENAZIZI — Análise de Funcionalidades

## Situação Atual

O Dashboard tem **44 componentes** e renderiza **~25 elementos visíveis** em uma única página scroll. Para uma tela mobile de 430px, isso é excessivo.

---

## Componentes e Análise

### ✅ FAZ SENTIDO — Manter

| Componente | Função | Justificativa |
|---|---|---|
| **MissionStartButton** | CTA principal "COMEÇAR ESTUDO" | Core do sistema guiado |
| **TodayStudyCard** | Lista tarefas do dia (Study Engine) | Direção clara do que estudar |
| **ApprovalScoreCard** | Score de prontidão para prova | Métrica central de progresso |
| **PendingReviewsCard** | Revisões pendentes (FSRS) | Essencial para retenção |
| **WeakTopicsCard** | Temas fracos | Guia estudo direcionado |
| **MotivationalGreeting** | Saudação + contexto | Humaniza, dá contexto rápido |
| **XpWidget** | XP e nível | Gamificação essencial |
| **DashboardWarnings** | Alertas de inatividade | Reengajamento |
| **InstallAppBanner** | PWA install | Aquisição mobile |

### ⚠️ REDUNDANTE OU CONFUSO — Candidatos a remover/fundir

| Componente | Problema |
|---|---|
| **FocusSelector** | Redundante com TodayStudyCard + MissionStartButton. O aluno já tem tarefas guiadas — oferecer "escolha o foco" contradiz o modelo guiado. |
| **QuickStartCard** | Sobreposição com OnboardingChecklist. Ambos aparecem para novos usuários com passos similares. |
| **OnboardingChecklist** | Pode substituir o QuickStartCard, mas os dois juntos confundem. Manter apenas um. |
| **SmartRecommendations** | Sobreposição com TodayStudyCard e BehavioralAlerts. Três componentes sugerem "o que estudar". |
| **BehavioralAlerts** | Sobreposição com WeakTopicsCard. Ambos mostram temas fracos — um por acurácia, outro por evasão. |
| **ContentLockStatusCard** | Conceito de "bloqueio de conteúdo" — se não há plano premium ativo, aparece vazio. Confuso sem contexto de monetização. |
| **DailyPlanWidget** | Aparece duas vezes: uma no scroll principal E outra dentro do Sheet "Cronograma". Duplicação. |
| **ApprovalTimeline** | Estimativa de "dias até estar pronto" — dado especulativo, pode gerar ansiedade sem base sólida. |
| **DashboardSummaryCard (grid 4 cards)** | Os 4 cards drill-down repetem dados já visíveis acima (score, tarefas, streak). Clique abre Sheets com gráficos que poucos usam no mobile. |

### 🔴 POPUPS EXCESSIVOS

| Componente | Problema |
|---|---|
| **WhatsNewPopup** | Popup ao entrar |
| **SystemGuidePopup** | Popup ao entrar |
| **FeedbackSurveyPopup** | Popup ao entrar |
| **OnboardingTour** | Popup ao entrar |
| **DashboardSmartPopups** | Popup ao entrar |
| **EndOfDaySummary** | Popup condicional |
| **ExamSetupReminder** | Popup/banner |
| **ExamSetupConfirmation** | Popup/banner |
| **AdminMessagesBanner** | Banner |
| **ActiveVideoRoomBanner** | Banner |

**São 10 popups/banners** que potencialmente competem pela atenção do aluno. Um novo usuário pode ver 3-4 popups ao abrir o dashboard pela primeira vez.

---

## Proposta de Simplificação

### Estrutura recomendada (de cima para baixo):

```text
┌─────────────────────────────┐
│ Saudação + XP               │  MotivationalGreeting + XpWidget
├─────────────────────────────┤
│ ⚡ COMEÇAR ESTUDO           │  MissionStartButton (CTA)
├─────────────────────────────┤
│ 📋 Tarefas de Hoje          │  TodayStudyCard
├─────────────────────────────┤
│ 🎯 Score de Aprovação       │  ApprovalScoreCard
├─────────────────────────────┤
│ 📝 Revisões  |  ⚠ Fracos   │  PendingReviewsCard + WeakTopicsCard
├─────────────────────────────┤
│ 🩺 Treino Prático           │  PracticalTrainingCard
├─────────────────────────────┤
│ 📊 Métricas (drill-down)    │  4 summary cards com Sheets
├─────────────────────────────┤
│ 🆓 Acesso Livre             │  FreeStudyCard
└─────────────────────────────┘
```

### Remover/Fundir:
1. **FocusSelector** → remover (redundante com missão guiada)
2. **QuickStartCard** → remover (OnboardingChecklist já cobre)
3. **SmartRecommendations** → fundir lógica no TodayStudyCard
4. **BehavioralAlerts** → fundir no WeakTopicsCard
5. **ApprovalTimeline** → mover para dentro do Sheet "Desempenho"
6. **DailyPlanWidget duplicado** → remover do scroll principal, manter só no Sheet
7. **ContentLockStatusCard** → remover se não há monetização ativa
8. **DashboardWarnings** → limitar a 1 alerta por vez (o mais urgente)

### Popups — Unificar:
- Criar um **sistema de fila** que mostra no máximo 1 popup por sessão
- Prioridade: Onboarding > ExamSetup > WhatsNew > Feedback
- Os demais ficam como notificações no sino (NotificationBell)

---

## Impacto Esperado
- Dashboard passa de **~25 componentes visíveis** para **~10**
- Menos scroll no mobile (430px)
- Fluxo de decisão mais claro: "abro o app → vejo missão → clico → estudo"
- Zero redundância de informação

## Arquivos Afetados
- `src/pages/Dashboard.tsx` (reorganização e remoções)
- `src/components/dashboard/FocusSelector.tsx` (remover)
- `src/components/dashboard/QuickStartCard.tsx` (remover)
- `src/components/dashboard/SmartRecommendations.tsx` (fundir ou remover)
- `src/components/dashboard/BehavioralAlerts.tsx` (fundir no WeakTopicsCard)
- `src/components/dashboard/ApprovalTimeline.tsx` (mover para Sheet)
- `src/components/dashboard/DashboardWarnings.tsx` (limitar a 1)

