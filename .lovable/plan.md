

# Tornar usuários online clicáveis no painel Admin

## O que será feito

Ao clicar no nome/card de um usuário online na seção "Usuários online agora", o sistema abrirá o painel de detalhes/cadastro desse usuário (o mesmo `userDetailDialog` já existente no Admin).

## Mudanças

### 1. `src/components/admin/AdminOnlineUsers.tsx`
- Adicionar prop `onUserClick: (userId: string) => void`
- Tornar cada card de usuário clicável com `cursor-pointer` e `hover` visual
- Chamar `onUserClick(ou.user_id)` ao clicar

### 2. `src/pages/Admin.tsx`
- Passar callback `onUserClick` para `AdminOnlineUsers`
- No callback, buscar o `AdminUser` correspondente na lista `users` pelo `user_id`
- Se encontrado, abrir `setUserDetailDialog({ open: true, user: foundUser })`
- Se não encontrado (usuário não carregado na lista), exibir toast informativo

## Impacto
- Zero mudança em rotas ou lógica de negócio
- Reutiliza o dialog de detalhes já existente
- 2 arquivos editados

