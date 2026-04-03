

# Corrigir Dashboard não atualiza após revisões

## Problema
Quando o usuário completa revisões (ou qualquer atividade em módulos) e volta ao Dashboard, os dados não atualizam. Isso acontece porque:
1. Nenhum módulo invalida o cache `["dashboard-data"]` ao concluir atividades
2. O `staleTime` de 30s mantém dados antigos em navegação SPA (sem refocus de janela)
3. Não há subscription realtime nas tabelas relevantes

## Solução

### 1. Invalidar cache ao retornar ao Dashboard (`src/pages/Dashboard.tsx`)
Adicionar `useEffect` que invalida `["dashboard-data"]` toda vez que o componente monta (usuário navega de volta):
```typescript
const queryClient = useQueryClient();
useEffect(() => {
  queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
}, []);
```

### 2. Invalidar cache nos módulos ao concluir atividades
Nos principais pontos de saída dos módulos, invalidar o cache antes de navegar:
- `MissionMode.tsx` — ao concluir/encerrar missão
- `Flashcards.tsx` — ao terminar sessão de revisão
- `StudySession.tsx` — ao concluir sessão
- `Simulados.tsx` — ao finalizar simulado

### 3. Adicionar realtime para tabelas críticas (`src/pages/Dashboard.tsx`)
Subscription em `practice_attempts`, `flashcards`, `reviews` e `study_tasks` para invalidar automaticamente:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('dashboard-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'practice_attempts', filter: `user_id=eq.${user.id}` }, () => queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `user_id=eq.${user.id}` }, () => queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [user?.id]);
```

Migration SQL necessária:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE practice_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
```

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/Dashboard.tsx` | Invalidar cache no mount + realtime subscription |
| `src/pages/MissionMode.tsx` | Invalidar `dashboard-data` ao sair |
| `src/pages/Flashcards.tsx` | Invalidar `dashboard-data` ao concluir |
| `src/pages/StudySession.tsx` | Invalidar `dashboard-data` ao concluir |
| Migration SQL | Habilitar realtime em `practice_attempts` e `reviews` |

## Resultado
Dashboard sempre exibe dados atualizados ao retornar de qualquer módulo.

