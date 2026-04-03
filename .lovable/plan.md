

# Melhorias na Mentoria — Temas livres, destinatários visíveis e alunos avulsos

## Resumo
Refatorar o formulário de criação de mentoria para: (1) permitir digitar temas e subtópicos livremente, (2) mostrar lista dos destinatários antes de publicar, (3) permitir adicionar alunos avulsos independente do público-alvo escolhido.

## Alterações em `src/components/professor/MentorThemePlans.tsx`

### 1. Temas — Input livre (substituir Select)
- Remover imports: `CycleFilter`, `getFilteredSpecialties`, `ALL_SPECIALTIES`, `SPECIALTY_SUBTOPICS`
- Remover state `cycleFilter` e `subtopicOptions`
- Trocar o `<Select>` de tema por `<Input placeholder="Digite o tema (ex: Cardiologia)">`
- Trocar o `<Select>` de subtópico por `<Input placeholder="Subtópico (opcional)">`
- Manter botão "Adicionar" e badges removíveis

### 2. Destinatários — Múltiplos alunos avulsos
- Trocar `selectedStudentId` (string) por `selectedStudents` (array de `{user_id, display_name, faculdade, periodo}`)
- Ao clicar num resultado de busca, adicionar à lista (toggle — clicar de novo remove)
- Mostrar badges dos alunos selecionados com ✕ para remover
- Adicionar filtros de **faculdade** (`<Select>` com `FACULDADES`) e **período** (`<Select>` 1-12) na busca de alunos
- Aplicar filtros na query Supabase (`.eq("faculdade", ...)`, `.eq("periodo", ...)`)

### 3. Seção "Quem receberá" (preview de destinatários)
- Adicionar botão `👥 Ver destinatários` que carrega e exibe a lista de alunos que receberão a mentoria
- Para turma: buscar `class_members` e cruzar com `profiles`
- Para instituição: buscar `institution_members` e cruzar com `profiles`
- Para alunos avulsos: mostrar diretamente os `selectedStudents`
- Exibir lista compacta com nome, faculdade e período
- Mostrar contador: "X aluno(s) receberão esta mentoria"

### 4. Lógica de criação — suportar múltiplos alunos
- No `handleCreate`, inserir um `mentor_theme_plan_targets` para cada aluno avulso selecionado (target_type: "student", target_id: user_id)
- Coletar todos os `studentIds` dos alunos avulsos para gerar `mentor_theme_plan_progress`
- Permitir combinar turma/instituição + alunos avulsos extras

### 5. Reset e cleanup
- Atualizar `resetForm` para limpar `selectedStudents` e filtros
- Remover imports e states não utilizados

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/components/professor/MentorThemePlans.tsx` | Refatorar formulário completo |

