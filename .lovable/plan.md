

# Cadastro de Professor com Escopo por Universidade

## Objetivo

Adicionar a opção "Professor" no formulário de cadastro. O professor informará sua universidade durante o registro, e seu acesso no painel será automaticamente restrito aos alunos dessa universidade.

## Mudanças

### 1. `src/pages/Register.tsx` — Adicionar tipo de conta e faculdade

- Adicionar seletor "Estudante / Professor" (botões como no onboarding do ProtectedRoute)
- Quando "Professor" selecionado, mostrar campo obrigatório de Faculdade (usando `FaculdadeCombobox`)
- Passar `user_type` e `faculdade` no `signUp` via `options.data` (metadata)

### 2. `src/hooks/useAuth.tsx` — Expandir `signUp`

- Aceitar parâmetros opcionais `userType` e `faculdade`
- Incluir no `raw_user_meta_data`: `user_type`, `faculdade`

### 3. Trigger `handle_new_user` (migração SQL)

- Atualizar a função para ler `raw_user_meta_data->>'user_type'` e `raw_user_meta_data->>'faculdade'` e salvar no profile
- Se `user_type = 'professor'`, inserir role `professor` na tabela `user_roles` (além do `user` padrão)

### 4. `src/components/auth/ProtectedRoute.tsx` — Onboarding do professor

- No formulário de completar cadastro, adicionar opção "Professor" ao seletor de tipo (já tem estudante/médico)
- Quando professor selecionado, mostrar campo de faculdade (obrigatório) mas esconder período
- Ao salvar, se `user_type = 'professor'`, inserir role professor via edge function ou diretamente

### 5. `supabase/functions/professor-simulado/index.ts` — Escopo por faculdade do professor

- No `get_students`: buscar a `faculdade` do perfil do professor e usar como filtro obrigatório (admins continuam vendo tudo)
- No `class_analytics`: mesmo tratamento — professor só vê alunos da sua faculdade
- No `create_simulado`: se professor não informar faculdade no filtro, usar a dele por padrão

### 6. `src/lib/profileValidation.ts` — Validação para professor

- Ajustar `isProfileComplete` para aceitar `user_type = 'professor'` — exigir faculdade mas não período

## Detalhes técnicos

- A role `professor` já existe no enum `app_role` e é verificada no `useProfessorCheck`
- O trigger `handle_new_user` roda com `SECURITY DEFINER`, então pode inserir em `user_roles` sem problema de RLS
- O `ProfessorRoute` já verifica `user_roles` para role `professor` — uma vez inserida, o professor terá acesso automático ao painel
- A faculdade do professor fica em `profiles.faculdade`, reutilizando o campo já existente

