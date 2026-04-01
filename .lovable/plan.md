

# BI do Professor — Proficiência + Plataforma Geral

## Objetivo

Criar duas visões de BI no painel do professor:
1. **BI de Proficiência** — análise cruzada de desempenho nas atividades criadas pelo professor (simulados, casos clínicos, temas de estudo): assuntos deficitários, assuntos dominados, sugestão de abordagem pedagógica
2. **BI Geral da Turma** — análise da utilização geral da plataforma pelo aluno (questões respondidas, streaks, revisões, banco de erros, tempo de estudo)

## Arquitetura

```text
┌─────────────────────────────────────────────┐
│  ProfessorDashboard.tsx                     │
│  Nova aba: "BI" (entre Analytics e Alunos)  │
│  └─ ProfessorBIPanel.tsx                    │
│     ├─ Seção 1: BI Proficiência             │
│     │   - KPIs (total atividades, taxa      │
│     │     conclusão, média geral, pendentes)│
│     │   - Desempenho por tema/assunto       │
│     │   - Assuntos deficitários (radar)     │
│     │   - Assuntos dominados                │
│     │   - Sugestão pedagógica por IA        │
│     │   - Filtro por aluno específico       │
│     └─ Seção 2: BI Geral Plataforma        │
│         - Engajamento (streak, XP, dias     │
│           ativos, questões respondidas)     │
│         - Erros mais frequentes             │
│         - Especialidades por acurácia       │
│         - Heatmap de atividade              │
└─────────────────────────────────────────────┘
```

## Mudanças

### 1. Nova action na Edge Function: `professor_bi`

Arquivo: `supabase/functions/professor-simulado/index.ts`

Recebe `{ action: "professor_bi", faculdade?, periodo?, student_id? }`

**Dados de Proficiência** (atividades do professor):
- Busca todos os simulados, casos clínicos e temas do professor (ou admin vê todos)
- Cruza `teacher_simulado_results` com `questions_json` dos simulados para extrair desempenho **por tópico** (cada questão tem campo `topic`)
- Cruza `teacher_clinical_case_results` por especialidade e diagnóstico
- Cruza `teacher_study_assignment_results` por status de conclusão
- Calcula: taxa de conclusão, média de score, tópicos com pior desempenho, tópicos com melhor desempenho
- Se `student_id` fornecido, filtra apenas para aquele aluno

**Dados Gerais da Plataforma**:
- Busca `user_topic_profiles` para acurácia por especialidade
- Busca `error_bank` para temas com mais erros
- Busca `user_gamification` para engajamento (XP, streak, dias ativos)
- Busca `practice_attempts` das últimas 4 semanas para volume de estudo
- Agrega tudo por turma ou por aluno individual

**Sugestão Pedagógica** (via IA):
- Nova action `professor_bi_suggestion` que recebe o resumo dos dados e gera sugestões usando Gemini Flash
- Formato: 3-5 recomendações pedagógicas baseadas nos gaps identificados

### 2. Novo componente: `src/components/professor/ProfessorBIPanel.tsx`

- Recebe `callAPI` como prop (mesmo padrão dos outros componentes)
- Filtros: Faculdade, Período, Aluno específico (dropdown)
- **Seção "Proficiência"**:
  - 4 KPI cards: Total Atividades Criadas, Taxa de Conclusão, Média Geral, Pendentes
  - Gráfico de barras horizontal: Desempenho por Tópico (simulados)
  - Cards de "Assuntos Deficitários" (score < 50%) em vermelho
  - Cards de "Assuntos Dominados" (score > 80%) em verde
  - Tabela: resultado por atividade (simulado/caso/tema) com nome do aluno e score
- **Seção "Plataforma Geral"**:
  - 4 KPI cards: Questões Respondidas, Acurácia Média, Streak Médio, Inativos
  - Gráfico de barras: Top 10 temas com mais erros
  - Gráfico radar: Acurácia por especialidade
  - Lista de alunos ordenada por engajamento
- **Seção "Sugestão Pedagógica"**:
  - Botão "Gerar Sugestões" que chama a IA
  - Exibe cards com recomendações de abordagem

### 3. `src/pages/ProfessorDashboard.tsx`

- Adicionar nova aba "BI" com ícone `BarChart3` no `TabsList`
- Renderizar `<ProfessorBIPanel />` no `TabsContent`

## Detalhes Técnicos

- Usa `recharts` (já instalado) para gráficos: BarChart, RadarChart, PieChart
- A análise por tópico dos simulados extrai o campo `topic` de cada questão dentro de `questions_json` e cruza com `answers_json` dos results para saber acerto/erro por tema
- Filtro por aluno específico usa dropdown com busca (lista de alunos da faculdade/período)
- Sugestão pedagógica usa Gemini Flash via `aiFetch` — rápido e sem custo de API key
- O BI é read-only, não modifica dados

