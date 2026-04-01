

# Remover Alerta de Saúde do Sistema do Dashboard

## Problema

O componente `AdminSystemAlerts` exibe um popup de saúde do sistema que fica preso na mesma mensagem repetidamente, mesmo após ser dispensado. Além disso, há um erro de runtime (`DashboardWarnings is not defined`) que precisa ser corrigido — provavelmente cache stale, mas vamos garantir que o arquivo está limpo.

## Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard.tsx` | Remover import e uso de `AdminSystemAlerts` (linhas 23 e 116-119) |

## Resultado

O popup de saúde do sistema não aparecerá mais no dashboard. As informações de saúde continuam acessíveis no painel admin (`/admin`) para quem precisar.

