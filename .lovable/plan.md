

# Excluir Módulo "Provas Anteriores"

Remover completamente o módulo da aplicação. São 4 arquivos a editar:

## Alterações

1. **Deletar** `src/pages/PreviousExams.tsx`

2. **`src/App.tsx`** — Remover import lazy e a Route `provas-anteriores`

3. **`src/components/layout/DashboardSidebar.tsx`** — Remover o item de menu `Provas Anteriores` da sidebar

4. **`src/hooks/useModuleAccess.ts`** — Remover `provas-anteriores` da lista de módulos

O banco de questões (`questions_bank`) permanece intacto — as questões continuam acessíveis via outros módulos como Simulados e Banco de Questões.

