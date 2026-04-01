

# Cadastro Obrigatório Completo + Tela de Conclusão

## Situação Atual

- **Register.tsx**: Estudantes só preenchem nome, email e senha. Telefone, faculdade e período ficam para depois.
- **ProtectedRoute.tsx**: Já tem tela "Complete seu cadastro" que bloqueia acesso até preencher tudo — funciona corretamente.
- **Dados**: Dos 143 estudantes, apenas ~41 têm perfil completo. ~102 estão com dados incompletos.

## O que já funciona

O `ProtectedRoute` já impede acesso se o perfil estiver incompleto. A tela de completar cadastro já existe e valida nome, telefone, período e faculdade.

## Mudanças

### 1. `src/pages/Register.tsx` — Exigir todos os campos no cadastro

Adicionar campos obrigatórios para estudantes diretamente na tela de registro:
- **WhatsApp** (com máscara e validação de DDD)
- **Faculdade** (combobox já existente)
- **Período** (select 1º ao 12º)

Validar com `isValidPhone` e `isValidName` antes de submeter. Passar telefone, período e faculdade nos metadados do signup.

### 2. `src/hooks/useAuth.tsx` — Incluir campos extras no signup

Expandir a função `signUp` para aceitar `phone` e `periodo` nos metadados do usuário, para que o trigger `handle_new_user` possa salvá-los.

### 3. Migração — Atualizar trigger `handle_new_user`

Modificar o trigger para extrair `phone` e `periodo` dos metadados e salvar no perfil automaticamente na criação.

### 4. `ProtectedRoute.tsx` — Manter como está

A tela "Complete seu cadastro" já funciona como fallback para os ~102 usuários antigos com dados incompletos. Nenhuma mudança necessária.

## Resultado

- Novos usuários preenchem TUDO no registro (nome, email, senha, whatsapp, faculdade, período)
- Usuários antigos sem dados completos continuam bloqueados pela tela existente até completarem
- Nenhum usuário acessa a plataforma sem perfil completo

