

# Plano: Implementar Otimizacoes Globais do Codigo

## Resumo
Reduzir queries duplicadas, adicionar cache com React Query, estabilizar heartbeat e memoizar componentes pesados. Zero mudanca visual.

## Alteracoes

### 1. Criar `src/hooks/useUserRoles.ts`
- Hook com React Query, key `["user-roles", userId]`, `staleTime: 10min`
- Uma query: `select role from user_roles where user_id = X`
- Retorna `{ isAdmin, isProfessor, roles, isLoading }`

### 2. Editar `src/hooks/useAdminCheck.ts`
- Substituir implementacao manual por wrapper fino sobre `useUserRoles()`
- Retorna `{ isAdmin, loading }` igual antes

### 3. Editar `src/hooks/useProfessorCheck.ts`
- Substituir implementacao manual por wrapper fino sobre `useUserRoles()`
- Retorna `{ isProfessor, loading }` igual antes

### 4. Editar `src/hooks/useGamification.ts`
- Migrar `fetchData` para `useQuery` com key `["gamification", userId]`, `staleTime: 60s`
- `addXp` faz `queryClient.setQueryData` otimista + `invalidateQueries` depois
- Remover `useState`/`useEffect` manuais para fetch

### 5. Editar `src/hooks/useDashboardData.ts`
- Remover segunda query a `chat_conversations` (linha 79) — ja tem na linha 76
- Usar count de `chroniclesRes` e `chatConvRes` separadamente sem query duplicada

### 6. Editar `src/hooks/usePresenceHeartbeat.ts`
- Usar `useRef` para `location.pathname` em vez de dependencia do effect
- O interval nao reseta mais a cada navegacao

### 7. Editar `src/components/dashboard/DashboardSummaryCard.tsx`
- Adicionar `React.memo` para evitar re-renders desnecessarios

### 8. Editar `src/pages/Dashboard.tsx`
- Envolver `SmartRecommendations` com `React.memo`
- Memoizar o grid de summary cards com `useMemo`

## Arquivos
- Criar: `src/hooks/useUserRoles.ts`
- Editar: `useAdminCheck.ts`, `useProfessorCheck.ts`, `useGamification.ts`, `useDashboardData.ts`, `usePresenceHeartbeat.ts`, `DashboardSummaryCard.tsx`, `Dashboard.tsx`

