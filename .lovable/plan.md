

## Plano: Botão "Desconectar Usuário" no Gerenciador de Usuários

### O que será feito
Adicionar um botão "Desconectar" (logout remoto) na lista de ações de cada usuário no painel admin, que invalida todas as sessões ativas do usuário selecionado.

### Implementação

**1. Backend — Edge Function `admin-actions/index.ts`**
- Adicionar novo case `force_logout` no switch
- Usar `supabaseAuth.auth.admin.signOut(target_user_id, 'global')` para invalidar todas as sessões
- Registrar no audit log com ação `force_logout`

**2. Frontend — `src/pages/Admin.tsx`**
- Adicionar estado `logoutDialog` (confirmação antes de desconectar)
- Adicionar botão com ícone `LogOut` na seção de ações de cada usuário (ao lado de "Acompanhar")
- Criar dialog de confirmação ("Tem certeza que deseja desconectar {nome}?")
- Criar função `handleForceLogout` que chama `callAdmin({ action: "force_logout", target_user_id })`
- Adicionar label `force_logout` no mapeamento de auditoria

**3. Detalhes técnicos**
- Importar `LogOut` do lucide-react (já usado em outros arquivos)
- O botão será desabilitado para o próprio admin (não pode desconectar a si mesmo)
- Toast de sucesso: "Sessão do usuário encerrada com sucesso"

