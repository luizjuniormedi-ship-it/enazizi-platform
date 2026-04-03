

# Adicionar "Prova Prática" aos Menus de Navegação

## Problema
O módulo "Prova Prática" (OSCE) tem rota funcional (`/dashboard/prova-pratica`) mas **não aparece em nenhum menu** — nem na sidebar, nem na barra inferior mobile. O acesso só é possível via cards no Dashboard.

## Alteração

### Arquivo: `src/components/layout/DashboardSidebar.tsx`
- Adicionar item `{ to: "/dashboard/prova-pratica", icon: Stethoscope, label: "Prova Prática" }` no grupo **"Prática e Progresso"** (entre "Anamnese" e "Plantão")
- O ícone `Stethoscope` já está importado no arquivo

### Arquivo: `src/components/layout/BottomTabBar.tsx` (se aplicável)
- Verificar se o módulo deve aparecer também na navegação mobile inferior ou se já está acessível pelo menu lateral mobile

## Resultado
- "Prova Prática" visível e acessível diretamente pelo menu lateral
- Consistente com os outros módulos de prática clínica

