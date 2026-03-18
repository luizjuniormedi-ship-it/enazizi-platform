

# Plano: Selecao Individual de Alunos para Sala de Video

## Objetivo
Permitir que o professor veja a lista completa de alunos, filtre por faculdade/periodo, e selecione individualmente (clique 1 a 1) quais alunos serao convidados para a sala de video.

## Mudancas

### 1. Componente `VideoRoom.tsx` - Adicionar lista de alunos com selecao individual
- Apos filtrar por faculdade/periodo, carregar lista de alunos via edge function `professor-simulado` (action `get_students`) -- mesma API usada no `StudentTracker`
- Exibir lista de alunos com checkboxes clicaveis (igual ao padrao ja usado em `ProfessorDashboard.tsx` com `selectedStudentIds`)
- Campo de busca por nome para filtrar a lista
- Botoes "Selecionar todos" / "Desmarcar todos"
- Contador de alunos selecionados
- Ao criar sala, salvar os IDs dos alunos selecionados

### 2. Tabela `video_rooms` - Nova coluna `invited_students`
- Adicionar coluna `invited_students jsonb default '[]'` para armazenar array de user_ids convidados
- Migration SQL simples

### 3. Banner do aluno (`ActiveVideoRoomBanner.tsx`) - Filtrar por convite individual
- Alem de filtrar por faculdade/periodo, verificar se o user_id do aluno esta no array `invited_students`
- Se `invited_students` estiver vazio (professor nao selecionou ninguem especifico), manter comportamento atual (todos que batem no filtro)

### Arquivos a editar
- `src/components/professor/VideoRoom.tsx` -- adicionar lista de alunos com selecao
- `src/components/dashboard/ActiveVideoRoomBanner.tsx` -- filtrar por invited_students
- Migration SQL para coluna `invited_students`

