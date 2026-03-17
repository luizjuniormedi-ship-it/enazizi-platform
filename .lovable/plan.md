

# Plantão Médico na Área de Proficiência

## Objetivo
Permitir que o professor crie casos clínicos de "Plantão Médico" e atribua a alunos específicos. O aluno acessa pela área de Proficiência e interage com o caso usando a mesma mecânica do Modo Plantão existente (chat interativo, ações rápidas, timer, avaliação em 7 categorias).

## Arquitetura

```text
Professor Dashboard          Student Proficiência
┌──────────────────┐         ┌──────────────────┐
│ Nova aba:         │         │ Lista simulados   │
│ "Casos Plantão"  │         │ + Lista plantões  │
│                  │         │                  │
│ ● Seleciona      │         │ ● Clica "Iniciar"│
│   especialidade   │  ───►   │ ● Chat interativo│
│ ● Gera caso IA   │ assign  │   (igual Plantão) │
│ ● Atribui alunos │         │ ● Timer, score   │
│ ● Vê resultados  │         │ ● Avaliação 7cat │
└──────────────────┘         └──────────────────┘
```

## Mudanças no Banco de Dados

**Nova tabela `teacher_clinical_cases`:**
- `id`, `professor_id`, `title`, `specialty`, `difficulty`, `time_limit_minutes`
- `case_prompt` (jsonb) — dados do caso gerado pela IA (patient_presentation, vitals, setting, hidden_diagnosis, etc.)
- `status` (draft/published), `created_at`, `updated_at`

**Nova tabela `teacher_clinical_case_results`:**
- `id`, `case_id` (FK → teacher_clinical_cases), `student_id`
- `status` (pending/in_progress/completed)
- `conversation_history` (jsonb), `final_evaluation` (jsonb)
- `final_score`, `grade`, `correct_diagnosis`, `student_got_diagnosis` (boolean)
- `time_total_minutes`, `xp_earned`, `started_at`, `finished_at`, `created_at`

**RLS Policies:**
- Professores: CRUD nos próprios cases; SELECT nos results dos próprios cases
- Alunos: SELECT nos cases atribuídos (via results); ALL nos próprios results
- Admins: SELECT em tudo

## Edge Function: `professor-simulado`

Adicionar novas actions ao edge function existente:

1. **`generate_clinical_case`** — Chama a IA com o mesmo SYSTEM_PROMPT do clinical-simulation para gerar um caso (action="start"), retorna o JSON completo ao professor para preview
2. **`create_clinical_case`** — Salva o caso na tabela + cria results "pending" para alunos selecionados
3. **`list_clinical_cases`** — Lista casos do professor com resumo de resultados
4. **`get_clinical_case_results`** — Detalhes de resultados de um caso específico

## Edge Function: `clinical-simulation`

Adicionar suporte a `teacher_case_id`:
- Quando `action="start"` recebe `teacher_case_id`, busca o caso pré-criado do banco em vez de gerar um novo
- As demais actions (interact, hint, specialist, finish) funcionam igual
- No `finish`, salva resultado na `teacher_clinical_case_results` além da `simulation_history`

## Frontend

### ProfessorDashboard — Nova aba "Casos Plantão"
- Formulário: escolher especialidade, dificuldade, gerar caso via IA (preview do caso)
- Seleção de alunos (mesmo mecanismo de filtro faculdade/período + checkboxes)
- Lista de casos criados com status (X completaram / Y atribuídos)
- Dialog de resultados: nota, grade, diagnóstico correto vs proposto, avaliação detalhada

### StudentSimulados — Seção "Plantões Atribuídos"
- Lista de casos de plantão pendentes/completados, separada dos simulados de questões
- Ao clicar "Iniciar": abre interface idêntica ao ClinicalSimulation, mas usando o caso pré-definido do professor
- Componente reutilizável extraído do ClinicalSimulation para a mecânica de chat/timer/avaliação

### Componente Compartilhado
- Extrair a lógica de interação do `ClinicalSimulation.tsx` (chat, timer, ações rápidas, tela de resultado) em um componente `ClinicalSimulationEngine` que aceita:
  - `teacherCaseId?` — para casos do professor
  - `specialty`, `difficulty` — para modo livre
  - `onComplete(evalData)` — callback para salvar resultados

## Resumo de Implementação

1. Criar migration: tabelas `teacher_clinical_cases` e `teacher_clinical_case_results` com RLS
2. Atualizar `professor-simulado/index.ts` com 4 novas actions
3. Atualizar `clinical-simulation/index.ts` para aceitar `teacher_case_id`
4. Extrair `ClinicalSimulationEngine` do `ClinicalSimulation.tsx`
5. Adicionar aba "Casos Plantão" no `ProfessorDashboard.tsx`
6. Adicionar seção "Plantões" no `StudentSimulados.tsx` com o engine reutilizado
7. Deploy das edge functions e teste end-to-end

