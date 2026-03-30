

# Integrar Feynman ao Tutor + Remover Áudio/Avatar

## Viabilidade: Confirmada

A arquitetura modular do Tutor (hooks separados, fases numeradas, prompt sequencial) torna todas as mudanças cirúrgicas e seguras.

## Mudanças

### 1. Adicionar Feynman como Etapa 15
**`src/hooks/tutor/useChatProgress.ts`**
- Adicionar `"feynman"` ao `getPhaseMap` (step 15) com prompt pedindo explicação leiga + avaliação 4 critérios
- Adicionar entrada step 14 → Feynman no `getNextPhaseInfo`

**`src/components/tutor/TutorStepTracker.tsx`**
- Mudar total de 14 para 15

**`supabase/functions/_shared/enazizi-prompt.ts`**
- Adicionar STATE 15 — Método Feynman ao fluxo pedagógico

### 2. Remover Áudio e Avatar do Tutor
**`src/pages/ChatGPT.tsx`**
- Remover imports/uso de `useTutorAudio`, `useSpeechToText`, `CinematicAvatar`
- Remover state `showAvatar3D`
- Simplificar props passadas ao Header e InputBar

**`src/components/tutor/TutorHeader.tsx`**
- Remover props e itens de menu de avatar/áudio

**`src/components/tutor/TutorInputBar.tsx`**
- Remover botões de microfone e stop speaking

### 3. Remover Feynman Standalone
**`src/pages/AgentsHub.tsx`** — Remover card Feynman
**`src/App.tsx`** — Remover rota, adicionar redirect `/dashboard/feynman` → `/dashboard/chatgpt`
**`src/components/layout/DashboardSidebar.tsx`** — Remover item de menu
**`src/hooks/useModuleAccess.ts`** — Remover entrada `feynman`

## Arquivos: ~10 editados | Impacto: Zero breaking changes

