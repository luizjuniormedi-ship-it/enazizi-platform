

# Plano: Corrigir atualização de revisões pendentes após execução de tarefas

## Problema
Quando o usuário completa uma revisão ou tarefa de estudo, as revisões pendentes no Dashboard não atualizam porque:

1. **QuestionsBank** (módulo principal de revisão) **nunca invalida nenhum cache** após o usuário responder questões
2. **Nenhum módulo invalida `core-data`** — que é a fonte de dados do Study Engine. Mesmo invalidando `study-engine`, os dados base continuam stale
3. O `study-engine` tem `refetchOnWindowFocus: false`, então voltar ao Dashboard não dispara refetch
4. O `PendingReviewsCard` lê do cache do `study-engine`, que permanece com dados antigos

## Correção

### 1. QuestionsBank — adicionar invalidação ao concluir sessão
Em `src/pages/QuestionsBank.tsx`, importar `useDashboardInvalidation` e chamar `invalidateAll()` quando o usuário terminar de responder questões (ao sair da página ou concluir a sessão).

### 2. Adicionar `core-data` nas invalidações de todos os módulos de estudo
Nos módulos que já invalidam `dashboard-data` e `study-engine` mas esquecem `core-data`:
- `src/pages/Flashcards.tsx`
- `src/pages/ClinicalSimulation.tsx`
- `src/pages/Simulados.tsx`
- `src/pages/AnamnesisTrainer.tsx`
- `src/pages/PracticalExam.tsx`
- `src/pages/CronogramaInteligente.tsx`

Adicionar `queryClient.invalidateQueries({ queryKey: ["core-data"] })` junto das invalidações existentes.

### 3. Habilitar refetch on window focus no Study Engine
Em `src/hooks/useStudyEngine.ts`, alterar `refetchOnWindowFocus: false` para `refetchOnWindowFocus: true`. Isso garante que ao voltar para a aba do Dashboard, os dados sejam recalculados.

### 4. MissionMode — invalidar `core-data` também
Em `src/pages/MissionMode.tsx`, adicionar `core-data` na função `invalidateDashboard`.

## Arquivos a alterar
1. `src/pages/QuestionsBank.tsx` — adicionar `useDashboardInvalidation` + `invalidateAll()`
2. `src/pages/Flashcards.tsx` — adicionar invalidação de `core-data`
3. `src/pages/ClinicalSimulation.tsx` — adicionar invalidação de `core-data`
4. `src/pages/Simulados.tsx` — adicionar invalidação de `core-data`
5. `src/pages/AnamnesisTrainer.tsx` — adicionar invalidação de `core-data`
6. `src/pages/PracticalExam.tsx` — adicionar invalidação de `core-data`
7. `src/pages/CronogramaInteligente.tsx` — adicionar invalidação de `core-data`
8. `src/pages/MissionMode.tsx` — adicionar `core-data` na invalidação
9. `src/hooks/useStudyEngine.ts` — `refetchOnWindowFocus: true`

## O que NÃO muda
- Study Engine, PendingReviewsCard, MissionEntry, rotas, banco de dados

