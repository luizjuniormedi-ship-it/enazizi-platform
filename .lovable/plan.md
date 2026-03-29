
# Substituir Cronograma pelo Planner IA

## Mudanças

### 1. Sidebar (`DashboardSidebar.tsx`)
- Remover a linha do Cronograma (`/dashboard/cronograma`)
- Renomear o Planner para "🧠 Planner IA"

### 2. Rotas (`App.tsx`)
- Redirecionar `/dashboard/cronograma` para `/dashboard/planner` (usando `Navigate`)
- Manter a rota do Planner como está

### 3. Referências internas
- Atualizar `studyRouter.ts` caso `cronograma` aponte para o antigo módulo
- Verificar outros componentes do dashboard que linkam para `/dashboard/cronograma` e apontar para `/dashboard/planner`

### Resultado
- Sidebar mostra apenas "🧠 Planner IA" no grupo Estudo
- Usuários que acessarem `/dashboard/cronograma` são redirecionados automaticamente
- Zero funcionalidade perdida — o Planner já inclui tudo do cronograma
