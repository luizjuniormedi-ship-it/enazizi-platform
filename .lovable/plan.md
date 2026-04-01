
# Melhorias no Painel Professor — BI e Funcionalidades

## Melhorias Identificadas

### 1. BI: Adicionar "Alunos em Risco" com alertas visuais
- Cruzar score médio < 50% + inatividade > 7 dias para gerar lista de alunos em risco
- Card destacado em vermelho com nome do aluno, motivo do risco e nível de criticidade
- Dados já disponíveis no retorno do `professor_bi` (engagement + scores)

### 2. BI: Exportar relatório em PDF
- Botão "Exportar PDF" no BI que gera relatório com KPIs, gráficos de tópicos e lista de alunos
- Usar a lib `exportPdf` já existente no projeto (`src/lib/exportPdf.ts`)
- Dois tipos: relatório da turma (geral) e dossiê individual do aluno

### 3. BI: Evolução temporal (linha do tempo)
- Adicionar gráfico de linha mostrando evolução da acurácia média da turma nas últimas 8 semanas
- Novo campo no `professor_bi` que agrega `practice_attempts` por semana
- Usa `LineChart` do recharts (já instalado)

### 4. BI: Comparativo do aluno vs turma
- Quando filtrar por aluno específico, mostrar card com percentil do aluno em relação à turma
- Ex: "Matheus está no percentil 75 da turma em Cardiologia"

### 5. Geral: Indicador visual de atividades não respondidas por aluno
- Na tabela de atividades, destacar em amarelo/vermelho atividades pendentes há mais de 3 dias
- Adicionar coluna "Dias Pendente" com badge de urgência

## Mudanças Técnicas

### `supabase/functions/professor-simulado/index.ts`
- Na action `professor_bi`: adicionar campo `at_risk_students` (score < 50% ou inativo > 7d)
- Adicionar campo `weekly_evolution` (acurácia por semana, últimas 8 semanas)
- Adicionar campo `student_percentiles` quando `student_id` fornecido

### `src/components/professor/ProfessorBIPanel.tsx`
- Nova seção "Alunos em Risco" com cards de alerta (ícone AlertTriangle, fundo vermelho/âmbar)
- Gráfico de evolução semanal (LineChart)
- Card de percentil quando aluno individual selecionado
- Botão "Exportar PDF" com geração client-side
- Coluna "Dias Pendente" na tabela de atividades com badge colorida

### `src/lib/exportPdf.ts`
- Adicionar função `exportProfessorBIReport` que monta HTML com KPIs + tabelas e converte para PDF
