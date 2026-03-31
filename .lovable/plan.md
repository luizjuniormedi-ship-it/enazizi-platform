

# Evolucao do BI do Professor - Performance Individual e Turma com PDF

## Estado Atual

O painel do professor tem duas abas relevantes:
- **Analise da Turma** (`ClassAnalytics`): mostra score medio, temas fracos, top alunos, distribuicao de scores. PDF basico com tabela simples.
- **Aluno Individual** (`StudentTracker`): mostra domain scores, erros, streak, simulados. **Sem exportacao PDF**.

**Lacunas identificadas:**
1. Sem dados de **engajamento** (dias ativos, tempo de estudo, sessoes)
2. Sem **evolucao temporal** (tendencia de score por semana)
3. Sem **comparativo aluno vs turma**
4. Sem dados de **simulados do professor** no analytics da turma
5. PDF do aluno individual nao existe
6. PDF da turma e muito basico (sem graficos/charts, so texto)
7. Sem **taxa de conclusao de atividades** (temas de estudo, casos clinicos)

## Mudancas

### 1. Edge Function `professor-simulado` - Enriquecer dados

**`class_analytics` action** - Adicionar:
- Dados de `user_gamification` (XP, level, streak, dias ativos)
- Dados de `exam_sessions` (simulados proprios do aluno)
- Dados de `teacher_simulado_results` + `teacher_clinical_case_results` + `teacher_study_assignment_results` (atividades atribuidas)
- Calcular metricas agregadas: taxa engajamento, media de streak, alunos inativos (>7 dias)

**`student_detail` action** - Adicionar:
- Dados de `exam_sessions` (simulados proprios, historico com datas)
- Dados de `temas_estudados` (temas recentes)
- Dados de `teacher_clinical_case_results` (casos clinicos feitos)
- Dados de `teacher_study_assignment_results` (temas atribuidos)
- Evolucao temporal: ultimas 8 semanas de `practice_attempts` agrupadas por semana

### 2. `ClassAnalytics.tsx` - Dashboard da Turma Completo

- **Novos KPI cards**: Engajamento medio, Streak medio, Alunos inativos (>7d), Taxa conclusao atividades
- **Grafico de distribuicao por especialidade**: barras horizontais com media de acerto por specialty
- **Lista de alunos em risco**: score < 50% ou inatividade > 7 dias, com badge "Critico"/"Atencao"
- **Comparativo de simulados atribuidos**: taxa de conclusao e media por simulado
- **PDF completo**: resumo executivo, KPIs, tabela de alunos com cores, temas fracos, alunos em risco

### 3. `StudentTracker.tsx` - Ficha Individual Completa

- **Evolucao semanal**: mini chart (ou tabela) com acerto por semana (ultimas 8 semanas)
- **Comparativo vs Turma**: barra mostrando posicao do aluno vs media da turma
- **Atividades atribuidas**: lista de temas, casos e simulados com status
- **Temas estudados recentemente**: ultimos 10 temas
- **Botao "Exportar PDF do Aluno"**: relatorio individual completo com todos os dados

### 4. PDF Individual do Aluno (`StudentTracker`)

- Cabecalho: nome, faculdade, periodo, data
- Resumo: score medio, questoes, acertos, streak, XP/level
- Tabela de especialidades com score e questoes
- Principais erros
- Historico de simulados
- Atividades atribuidas (status)
- Comparativo vs turma (posicao percentil)

### 5. PDF da Turma Melhorado (`ClassAnalytics`)

- Cabecalho profissional com filtros aplicados
- Resumo executivo: total alunos, media, engajamento, inativos
- Tabela completa de alunos com cores (verde/amarelo/vermelho)
- Top 5 + Bottom 5 alunos
- Temas fracos com contagem
- Distribuicao de scores (texto formatado)
- Alunos em risco com motivo

### Arquivos Impactados

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/professor-simulado/index.ts` | Enriquecer `class_analytics` e `student_detail` com mais dados |
| `src/components/professor/ClassAnalytics.tsx` | Novos KPIs, alunos em risco, PDF completo |
| `src/components/professor/StudentTracker.tsx` | Evolucao temporal, comparativo turma, atividades, PDF individual |

