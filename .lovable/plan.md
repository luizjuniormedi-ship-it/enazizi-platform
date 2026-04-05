

# Plano: Corrigir Redirect Pós-Login para MissionEntry

## Problema
O redirect do Dashboard para `/mission` não funciona porque:
1. O `useEffect` não aguarda as flags carregarem — durante loading, `isEnabled("mission_entry_enabled")` retorna `false` (safe default)
2. Se o usuário já visitou na mesma aba, `sessionStorage` já tem a chave e bloqueia o redirect

## Correção

### `src/pages/Dashboard.tsx`
- Adicionar `loading` do `useFeatureFlags` nas dependências
- Só avaliar o redirect **depois** que as flags carregarem (`if (loading) return`)
- Manter o resto da lógica igual

```typescript
const { isEnabled, loading: flagsLoading } = useFeatureFlags();

useEffect(() => {
  if (flagsLoading) return; // esperar flags carregarem
  const SESSION_KEY = "enazizi_mission_entry_seen";
  if (isEnabled("mission_entry_enabled") && !sessionStorage.getItem(SESSION_KEY)) {
    sessionStorage.setItem(SESSION_KEY, "true");
    navigate("/mission", { replace: true });
  }
}, [flagsLoading, isEnabled, navigate]);
```

## O que NÃO muda
- MissionEntry.tsx (já está correto)
- Rota `/mission` no App.tsx
- Feature flag no banco (já está enabled)
- Nenhum outro componente

## Resultado
- Login → Dashboard carrega → flags carregam → redirect para `/mission`
- Após visitar MissionEntry, volta ao Dashboard sem loop

