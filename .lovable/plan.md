

# Plan: Connect Cronograma to Questions Bank, Flashcards & Simulados

## What We're Building

When a user opens a review session (CronogramaRevisaoAtiva), the system will automatically fetch and display:
1. **Related questions** from `questions_bank` matching the theme/specialty
2. **Related flashcards** from `flashcards` matching the theme/specialty
3. **Quick-action buttons** to navigate to Simulados, Flashcards, and Tutor IA pre-filtered by topic

Additionally, the static "suggestions" section (currently only shown for high-risk themes) will become a dynamic, always-visible integration panel.

## Implementation

### 1. Enhance `CronogramaRevisaoAtiva.tsx`

- Add state for `relatedQuestions`, `relatedFlashcards`, and loading
- On mount, query `questions_bank` with `ilike` filter on `topic` matching `revisao.tema.tema` or `revisao.tema.especialidade` (limit 5)
- Query `flashcards` similarly (limit 5)
- Display a new **"Recursos para este tema"** section in the review step with 3 tabs/cards:
  - **Questões sugeridas**: Show up to 5 interactive question cards inline (reuse `InteractiveQuestionCard`)
  - **Flashcards**: Show up to 5 flashcard previews (question + reveal answer toggle)
  - **Ações rápidas**: Buttons linking to `/dashboard/questoes?topic=X`, `/dashboard/flashcards?topic=X`, `/dashboard/simulados`

### 2. Create `CronogramaRecursosRevisao.tsx` (new component)

A self-contained component that:
- Receives `tema` (string) and `especialidade` (string) as props
- Fetches questions and flashcards from the database
- Renders 3 collapsible sections with counts
- Includes navigation buttons to full modules
- Shows inline interactive questions using `InteractiveQuestionCard`

### 3. Wire into Review Flow

- Import and render `CronogramaRecursosRevisao` inside `CronogramaRevisaoAtiva` between the review checklist and the "Registrar desempenho" button
- Also show it on the "questions" step so users can practice before submitting

### 4. No Database Changes Needed

All data already exists in `questions_bank` and `flashcards` tables with universal read access (RLS allows all authenticated users to read).

## Technical Details

- Query strategy: `or` filter combining `topic.ilike.%{tema}%` and `topic.ilike.%{especialidade}%` to maximize matches
- Limit results to 5 questions + 5 flashcards for performance
- Randomize selection with `.order('created_at', { ascending: false })` then shuffle client-side
- Lazy load: only fetch when component mounts (not blocking the review)
- Navigation links use React Router `useNavigate` with query params

