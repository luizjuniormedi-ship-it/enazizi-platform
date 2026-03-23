

# Plano: Remover "Simulado Completo" (duplicado do Simulados)

## Mudança

Remover todas as referências ao módulo "Simulado Completo" (`/dashboard/simulado-completo`) dos seguintes arquivos:

| Arquivo | O que remover |
|---------|---------------|
| `src/components/layout/DashboardSidebar.tsx` | Linha 58 — item do menu lateral |
| `src/components/layout/DashboardLayout.tsx` | Linha 55 — item do menu mobile |
| `src/App.tsx` | Linha 107 — rota `simulado-completo` |
| `src/hooks/useModuleAccess.ts` | Linha 22 — módulo da lista |
| `src/components/dashboard/DashboardMetricsGrid.tsx` | Linha 66 — trocar link de `/dashboard/simulado-completo` para `/dashboard/simulados` |
| `src/test/Routes.test.tsx` | Linhas 25, 57, 84 — remover das listas de rotas |

O card de métricas "Simulados feitos" no Dashboard continuará existindo, apenas apontando para `/dashboard/simulados`.

