
# Plano: Corrigir botão "COMEÇAR MISSÃO" na MissionEntry

## Problema
O botão "COMEÇAR MISSÃO" na MissionEntry navega para `/dashboard/missao`, mas a página MissionMode (linha 79) redireciona imediatamente de volta para `/dashboard` quando `state.status === "idle"` — ou seja, a missão não foi iniciada antes da navegação.

## Solução
Alterar `MissionEntry.tsx` para importar `useMissionMode` e chamar `startMission()` antes de navegar, igual ao que `MissionStartButton` já faz.

## Arquivo a alterar

**`src/pages/MissionEntry.tsx`**:
1. Importar `useMissionMode`
2. Extrair `state`, `startMission`, `resumeMission` do hook
3. Alterar `handleStart`:
   - Se `state.status === "active" || "paused"` → `resumeMission()` se pausado, depois navegar
   - Se `state.status === "idle"` → `startMission()` e depois navegar para `/dashboard/missao`

```tsx
const { state, startMission, resumeMission } = useMissionMode();

const handleStart = () => {
  if (state.status === "paused") resumeMission();
  if (state.status === "idle") startMission();
  navigate("/dashboard/missao");
};
```

## O que NÃO muda
- MissionMode.tsx, rotas, Dashboard, Study Engine
