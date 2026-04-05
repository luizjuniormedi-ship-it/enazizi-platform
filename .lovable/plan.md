
# Plano: Criar MissionEntry — Entrada Pós-Login para Missão

## Resumo
Criar uma página `/mission` que aparece após o login (controlada por feature flag `mission_entry_enabled`), mostrando a missão do dia com dados reais e um CTA para começar. O Dashboard continua intacto.

## Mudanças

### 1. Migration — nova flag
Inserir `mission_entry_enabled` (desabilitada por padrão) na tabela `system_flags`.

### 2. `src/hooks/useFeatureFlags.ts`
- Adicionar `"mission_entry_enabled"` ao tipo `FlagKey`
- Adicionar ao `SAFE_DEFAULTS` com valor `false`

### 3. `src/pages/MissionEntry.tsx` (novo)
- Usa `useDashboardData` para dados reais (revisões, questões, streak, accuracy)
- Se flag desativada → redirect para `/dashboard`
- Mostra: nome do aluno, stats rápidos, tarefas do dia, explicação, botão "COMEÇAR MISSÃO"
- Link secundário "Ir para dashboard"
- Marca `sessionStorage` para não redirecionar em loop

### 4. `src/App.tsx`
- Adicionar lazy import do `MissionEntry`
- Adicionar rota `/mission` dentro de `ProtectedRoute` (sem `DashboardLayout`, é tela cheia)

### 5. `src/pages/Dashboard.tsx`
- No início do componente, checar: se flag `mission_entry_enabled` ativa E `sessionStorage` não tem `enazizi_mission_entry_seen` → redirect para `/mission`
- Isso garante que o primeiro acesso pós-login vai para MissionEntry

## O que NÃO muda
- Dashboard, Study Engine, navegação lateral, banco de dados (além da flag)
- Flag começa desativada = zero impacto até admin ativar
