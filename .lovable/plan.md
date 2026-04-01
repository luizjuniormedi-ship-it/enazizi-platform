

# Exclusão de Atividades no Painel do Professor + Proficiência

## Situação Atual

Analisei o código em profundidade. A exclusão **já funciona** para os 3 tipos de atividade:

1. **Simulados** — Botão `Trash2` em `ProfessorDashboard.tsx` (linha 413) chama `delete_simulado` na edge function, que exclui `teacher_simulado_results` e depois `teacher_simulados`
2. **Casos Clínicos** — Botão `Trash2` em `ProfessorPlantao.tsx` (linha 302) chama `delete_clinical_case`, que exclui `teacher_clinical_case_results` e depois `teacher_clinical_cases`
3. **Temas de Estudo** — Botão `Trash2` em `TeacherStudyAssignments.tsx` (linha 226) chama `delete_study_assignment`, que exclui `teacher_study_assignment_results` e depois `teacher_study_assignments`

A aba Proficiência do aluno lê diretamente de `teacher_simulado_results`, `teacher_clinical_case_results` e `teacher_study_assignment_results`. Ao excluir pelo painel do professor, os resultados são removidos em cascata, logo **desaparecem automaticamente da Proficiência**.

## Problema Real: Erro de Build

O build está falhando. Preciso corrigir o erro de build que não está relacionado à funcionalidade de exclusão.

## Plano

### 1. Corrigir o erro de build

Adicionar `DialogDescription` ao segundo Dialog (Results Dialog, linha 868) em `ProfessorDashboard.tsx` — atualmente só tem `DialogTitle` sem `DialogDescription`, o que pode causar erro de acessibilidade.

### 2. Verificar se há outros arquivos com problema

Checar se algum outro arquivo modificado recentemente tem erros de TypeScript ou JSX.

## Resultado

- Build corrigido
- Exclusão de atividades no painel do professor continua funcionando normalmente com cascata para proficiência

