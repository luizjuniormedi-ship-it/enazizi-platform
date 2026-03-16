

# Plan: Restore Original Study Plan Module Alongside Cronograma Inteligente

## What Changes

Both modules will coexist as separate pages in the dashboard:

1. **Cronograma de Revisão** (`/dashboard/cronograma`) - the current spaced repetition engine (stays as-is)
2. **Plano de Estudos** (`/dashboard/plano-estudos`) - the original AI-generated study plan with exam date, edital upload, weekly schedule

## Implementation

### 1. Add Route in `App.tsx`
- Import `StudyPlan` from `@/pages/StudyPlan`
- Add route: `<Route path="plano-estudos" element={<StudyPlan />} />`

### 2. Add Sidebar Entry in `DashboardSidebar.tsx`
- Add a new menu item "Plano de Estudos" with `CalendarDays` icon pointing to `/dashboard/plano-estudos`
- Keep the existing "Cronograma de Revisão" entry separate

Both modules remain independent -- no code changes to either page component.

