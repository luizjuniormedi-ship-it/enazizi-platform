

# Busca de Alunos Aleatórios no Painel do Professor

## Resumo
Adicionar um campo de busca por nome/email que permite ao professor encontrar e adicionar qualquer aluno da plataforma, independente de faculdade ou período.

## Alterações

### `src/pages/ProfessorDashboard.tsx`

1. **Novo campo de busca textual** abaixo dos filtros de faculdade/período:
   - Input com placeholder "Buscar aluno por nome ou e-mail..."
   - Estado `studentSearch: string` para o texto digitado
   - Botão "Buscar" ao lado do input
   - Ao clicar, chama `callAPI({ action: "search_students", query: studentSearch })`
   - Resultados aparecem numa lista separada abaixo, com botão "+" para adicionar ao array `previewStudents` e `selectedStudentIds`
   - Evita duplicatas (não adiciona se já estiver na lista)

2. **Separação visual**: Label "Ou buscar aluno específico" com um input + botão, abaixo do botão "Ver alunos que receberão"

### `supabase/functions/professor-simulado/index.ts`

1. **Novo case `search_students`**:
   - Recebe `{ query: string }` (mínimo 3 caracteres)
   - Busca em `profiles` com `ilike` no `display_name` e `email`
   - Filtra apenas `status = 'active'` e `user_type = 'estudante'`
   - Retorna até 20 resultados com `user_id, display_name, email, faculdade, periodo`
   - Sem restrição de faculdade do professor

```text
Fluxo:
1. Professor filtra por faculdade/período → lista padrão
2. Professor digita "João" no campo de busca → resultados de qualquer faculdade
3. Clica "+" no aluno → aluno é adicionado à lista de selecionados
4. Aluno aparece na lista principal com os demais
```

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ProfessorDashboard.tsx` | Input de busca por nome/email + lógica de adicionar alunos avulsos |
| `supabase/functions/professor-simulado/index.ts` | Novo case `search_students` com busca por nome/email sem filtro de faculdade |

