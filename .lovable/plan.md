

# Corrigir Dashboard em Branco + Aprimoramentos

## Problema: Dashboard em branco
O Dashboard tem vários componentes renderizados **fora** de `SafeCard`, o que significa que se qualquer um deles lançar um erro, o React derruba toda a página — mostrando apenas a tela genérica do ErrorBoundary ou, pior, uma tela branca.

**Componentes desprotegidos:**
- `MotivationalGreeting` (recebe props diretas — se `data` tiver campo inesperado, crash)
- `XpWidget` / `AchievementToast` / `PerformanceReport`
- `ExamSetupReminder`
- `FreeStudyCard`
- `AdminMessagesBanner`
- `OnboardingChecklist` (ambas instâncias)
- `ActiveVideoRoomBanner`
- `DailyPlanWidget` / `DailyGoalWidget` (dentro dos Sheets)

## Solução

### 1. Envolver TODOS os componentes do Dashboard em SafeCard (`src/pages/Dashboard.tsx`)

Cada componente ou grupo de componentes que não está dentro de `SafeCard` será envolvido. Isso garante que uma falha isolada mostra apenas "Sem dados suficientes" naquele card, sem derrubar a página inteira.

```text
Antes:
  <MotivationalGreeting ... />        ← crash = tela branca
  <XpWidget />                        ← crash = tela branca

Depois:
  <SafeCard name="Greeting">
    <MotivationalGreeting ... />      ← crash = fallback local
  </SafeCard>
  <SafeCard name="XpWidget">
    <XpWidget />
  </SafeCard>
```

Componentes a proteger:
- `MotivationalGreeting` + `XpWidget` + `PerformanceReport` + `AchievementToast`
- `ActiveVideoRoomBanner`
- `ExamSetupReminder`
- `OnboardingChecklist` (ambas instâncias)
- `FreeStudyCard`
- `AdminMessagesBanner`
- Conteúdo dos 4 Sheets (Desempenho, Cronograma, Streak, Simulados)

### 2. Proteger acesso a `data` com fallback defensivo

No bloco `const { stats, metrics, displayName, hasCompletedDiagnostic } = data;`, adicionar fallback:

```typescript
const { stats, metrics, displayName, hasCompletedDiagnostic } = data || {};
if (!stats || !metrics) {
  return <PageLoader />;
}
```

### 3. Aprimoramentos sugeridos

- **`useDashboardData`**: O `try/catch` já retorna defaults vazios — verificar que nenhuma das 21 queries paralelas pode lançar exceção não-capturada (todas usam destructuring `{ data, error }` do Supabase, que nunca lança)
- **Lazy-loaded components nos Sheets**: Já estão em `Suspense` — ok
- **Popups lazy-loaded**: Já em `Suspense fallback={null}` — ok

## Resumo das alterações

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard.tsx` | Envolver todos os componentes desprotegidos em `SafeCard`; adicionar guard defensivo no destructuring de `data` |

