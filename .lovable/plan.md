# Plano: Corrigir navegação pós-MissionEntry

## Problema
O autostart no `MissionStartButton` chama `startMission()` e limpa o query param, mas **não navega para `/dashboard/missao`**. O usuário fica preso no Dashboard em vez de ir para a tela de execução da missão.

## Correção

**`src/components/dashboard/MissionStartButton.tsx`** — no `useEffect` de autostart (linha 31-33), após `startMission()`, adicionar `navigate("/dashboard/missao")`:

```tsx
autostartFired.current = true;
startMission();
setSearchParams({}, { replace: true });
navigate("/dashboard/missao");
```

## O que NÃO muda
- MissionEntry.tsx, useMissionMode, rotas, Study Engine
