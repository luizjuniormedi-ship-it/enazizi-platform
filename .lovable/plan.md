
# Professor: Acesso Direto sem Aprovação Admin

## Problema

Atualmente, após cadastro, o professor fica preso na tela "Aguardando Aprovação" (status `pending`) igual ao aluno. O professor deveria poder acessar a plataforma imediatamente após completar o cadastro com sua universidade, sem precisar de aprovação do administrador.

## Mudanças

### 1. `src/components/auth/ProtectedRoute.tsx`

Na verificação de `profileStatus === "pending"` (linha 311), adicionar exceção para professores:
- Buscar `user_type` do profile (já é carregado na query)
- Se `user_type === "professor"` e profile completo (faculdade preenchida), pular a tela de aprovação e deixar acessar normalmente
- Auto-atualizar o status para `active` via update no profile quando professor completa cadastro

### 2. `src/components/auth/ProtectedRoute.tsx` — `handleOnboardingSave`

Quando o professor salva o cadastro:
- Além dos dados atuais, também setar `status: 'active'` no update do profile
- Isso garante que o professor não fique travado em "pending" após completar

### 3. Sem mudanças no `Register.tsx`

O formulário de registro já tem a opção professor com seleção de universidade e já passa `user_type` e `faculdade` no signup. O trigger `handle_new_user` já insere a role `professor` automaticamente.

## Fluxo Resultante

1. Professor se cadastra → seleciona universidade no registro
2. Confirma email → faz login
3. Se perfil já está completo (nome, phone, faculdade): acesso direto, status auto-ativado
4. Se perfil incompleto: mostra tela de completar cadastro → ao salvar, status vira `active` → acesso direto
5. Nunca mostra "Aguardando Aprovação" para professor

## Detalhes Técnicos

- O `isProfileComplete` já valida faculdade para professor
- A role `professor` já é inserida pelo trigger `handle_new_user`
- O `ProfessorRoute` já verifica `user_roles` — acesso ao painel professor funciona automaticamente
- Nenhuma migração necessária
