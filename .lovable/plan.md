

# Remover "Questões" e "Banco de Questões" da Navegação

## Contexto

O módulo Simulados já cobre a prática de questões com uma experiência superior (modo prova + modo estudo, navegação não-linear, flags, cronômetro). Manter "Questões" e "Banco de Questões" visíveis causa confusão e fragmenta o fluxo.

## O que muda

### Sidebar (`src/components/layout/DashboardSidebar.tsx`)
- Remover `{ to: "/dashboard/banco-questoes", icon: Database, label: "Questões" }` do grupo "Estudo"
- Remover `{ to: "/dashboard/questoes", icon: HelpCircle, label: "Gerador Questões" }` do grupo "Mais Ferramentas"

### Rotas (`src/App.tsx`)
- Adicionar redirects: `/dashboard/banco-questoes` → `/dashboard/simulados` e `/dashboard/questoes` → `/dashboard/simulados`
- Manter as páginas no código (não deletar) para não quebrar links externos ou bookmarks

### Nenhuma página deletada
As páginas `QuestionsBank.tsx` e `QuestionGenerator.tsx` continuam existindo — apenas ficam ocultas da navegação e redirecionam para Simulados.

| Arquivo | Mudança |
|---------|---------|
| `src/components/layout/DashboardSidebar.tsx` | Remover 2 itens do menu |
| `src/App.tsx` | Adicionar 2 `<Navigate>` redirects |

