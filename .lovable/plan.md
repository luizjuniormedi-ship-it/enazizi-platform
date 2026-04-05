# Plano: Criar MissionEntry — Entrada Pós-Login para Missão

## O que será feito

### 1. Nova feature flag no banco
- Inserir `mission_entry_enabled` na tabela `system_flags` (desabilitada por padrão)
- Adicionar ao tipo `FlagKey` em `useFeatureFlags.ts` com default `false`

### 2. Criar página `src/pages/MissionEntry.tsx`
- Componente conforme especificado pelo usuário
- Mostra missão do dia com dados reais do `useDashboardData`
- Botão principal "COMEÇAR MISSÃO" → `/dashboard/missao`
- Link "Ir para dashboard" como fallback
- Se flag desativada → redireciona para `/dashboard`
- Se sem dados → redireciona para `/dashboard`

### 3. Registrar rota em `App.tsx`
- Adicionar rota `/mission` como lazy-loaded dentro do `ProtectedRoute`
- Não altera rotas existentes

### 4. Redirecionar pós-login para MissionEntry
- No `ProtectedRoute.tsx`, após todas as verificações de perfil/onboarding passarem:
  - Se flag `mission_entry_enabled` ativa E rota atual é `/dashboard` (index) E não veio de navegação interna → redirecionar para `/mission`
  - Usar sessionStorage flag para evitar loop (só redireciona 1x por sessão)

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/hooks/useFeatureFlags.ts` | Adicionar `mission_entry_enabled` ao `FlagKey` e `SAFE_DEFAULTS` |
| `src/pages/MissionEntry.tsx` | **Novo** — página completa |
| `src/App.tsx` | Adicionar rota `/mission` com lazy load |
| `src/pages/Dashboard.tsx` | Adicionar redirect condicional no início se flag ativa e primeira visita da sessão |
| **Migration SQL** | Inserir flag `mission_entry_enabled` |

## O que NÃO muda
- Dashboard continua funcionando normalmente
- Study Engine intocado
- Navegação lateral intocada
- Qualquer módulo existente
- Se flag desligada = zero impacto
