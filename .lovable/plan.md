

# Implementar Sugestões: Admin/Delete, Gate para Staff, Sala de Aula na Proficiência

## Problemas Identificados

1. **`list_clinical_cases` e `list_study_assignments`** não verificam admin — admins só veem os próprios
2. **Falta delete** para casos clínicos e temas de estudo (professor e admin)
3. **ProficiencyGate bloqueia professores/admins** — deveria ignorar staff
4. **Aba "Sala de Aula" ausente na Proficiência** — aluno não vê salas de aula ativas do professor
5. **Casos de plantão na Proficiência** — os dados carregam mas o join `teacher_clinical_cases(*)` pode falhar silenciosamente se RLS bloquear

## Mudanças

### 1. Edge Function `professor-simulado/index.ts`

**`list_clinical_cases` (linha 623-660)**: Adicionar check `isAdmin` como já existe em `list_simulados`. Se admin, não filtrar por `professor_id`.

**`list_study_assignments` (linha 734-763)**: Mesmo padrão — admin vê todos.

**Nova action `delete_clinical_case`**: Verificar ownership ou admin, deletar results (`teacher_clinical_case_results`) e depois o caso (`teacher_clinical_cases`).

**Nova action `delete_study_assignment`**: Verificar ownership ou admin, deletar results (`teacher_study_assignment_results`) e depois o assignment (`teacher_study_assignments`).

### 2. `src/components/professor/ProfessorPlantao.tsx`

- Adicionar botão de lixeira (Trash2) em cada caso clínico com confirmação via `AlertDialog`
- Chamar `delete_clinical_case` via API

### 3. `src/components/professor/TeacherStudyAssignments.tsx`

- Adicionar botão de lixeira (Trash2) em cada tema com confirmação
- Chamar `delete_study_assignment` via API

### 4. `src/hooks/usePendingProficiency.ts`

- Consultar `user_roles` para verificar se é professor ou admin
- Se for staff, retornar `isBlocked: false` sempre

### 5. `src/pages/StudentSimulados.tsx` — Nova aba "Sala de Aula"

- Adicionar tab `video` com ícone de Vídeo: `📹 Sala de Aula`
- Consultar `video_rooms` onde `status = 'active'` (já filtrado pela RLS ou por faculdade)
- Mostrar salas ativas com link do Meet para o aluno acessar
- Salas encerradas mostrar como histórico

### Re-deploy

- Deploy da edge function `professor-simulado` após as mudanças

## Detalhes Técnicos

- A tabela `video_rooms` já existe e é acessível por alunos (RLS permite leitura para membros da instituição)
- Os deletes cascateiam: primeiro results, depois o registro principal
- O check de roles no hook usa a mesma query `user_roles` já cacheada pelo `useUserRoles`

