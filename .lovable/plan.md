

# Plano: Incluir DOCX nos uploads

## Resumo
Adicionar `.docx` como formato aceito nos inputs de upload que ainda nao suportam (Uploads, StudyPlan, StudyPlanContent). Alguns ja aceitam (AgentChat, CronogramaNovoTema, TeacherStudyAssignments).

## Alteracoes

### 1. `src/pages/Uploads.tsx`
- Linha 264: mudar `accept=".pdf,.txt"` para `accept=".pdf,.txt,.docx"`
- Linha 280: atualizar texto de "PDF, TXT" para "PDF, TXT, DOCX"

### 2. `src/pages/StudyPlan.tsx`
- Linha 501: mudar `accept=".pdf,.txt"` para `accept=".pdf,.txt,.docx"`

### 3. `src/components/cronograma/StudyPlanContent.tsx`
- Linha 421: mudar `accept=".pdf,.txt"` para `accept=".pdf,.txt,.docx"`

## Arquivos
- Editar: `Uploads.tsx`, `StudyPlan.tsx`, `StudyPlanContent.tsx`

