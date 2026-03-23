

# Plano: Atribuição de Temas pelo Professor → Tutor IA do Aluno

## Resumo

O professor cria "Atribuições de Estudo" com tema, tópicos obrigatórios para o Tutor IA e material de apoio (upload opcional). O aluno vê na Proficiência e clica para ir direto ao Tutor IA com tema pré-carregado. Após o estudo, questões são geradas automaticamente.

## Mudanças

### 1. Migração SQL — Novas tabelas

```sql
-- teacher_study_assignments: atribuições do professor
CREATE TABLE public.teacher_study_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  title text NOT NULL,
  specialty text NOT NULL,
  topics_to_cover text NOT NULL,        -- instruções para o Tutor IA
  material_url text,                     -- URL do storage (opcional)
  material_filename text,
  faculdade_filter text,
  periodo_filter integer,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Resultados individuais por aluno
CREATE TABLE public.teacher_study_assignment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES teacher_study_assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',  -- pending | studying | completed
  started_at timestamptz,
  completed_at timestamptz,
  questions_generated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: professor CRUD own assignments, aluno SELECT own results, admin SELECT all. Security definer function para aluno ler o assignment via result.

### 2. Painel do Professor (`ProfessorDashboard.tsx`)

Nova aba **"📖 Temas de Estudo"** na TabsList existente:
- Formulário: Título, Especialidade (select), **Tópicos a abordar** (textarea com instruções livres para o Tutor IA), Upload de material (opcional → storage `user-uploads`)
- Filtro de faculdade/período + seleção de alunos (reutiliza padrão existente)
- Botão "Atribuir Tema"
- Lista de atribuições criadas com status dos alunos

### 3. Área do Aluno — Proficiência (`StudentSimulados.tsx`)

Nova aba **"📖 Temas Atribuídos"**:
- Cards com título, especialidade, tópicos e status (pendente/estudando/concluído)
- Botão **"Estudar com Tutor IA"** → navega para `/dashboard/sessao-estudo?topic=X&professorTopics=Y&materialUrl=Z&assignmentId=ID`

### 4. Tutor IA (`StudySession.tsx`)

- Ler query params na inicialização
- Se `professorTopics` presente: pré-preencher tema e incluir instruções do professor no `userContext`
- Atualizar status do assignment para `studying` ao iniciar
- Ao concluir sessão com `assignmentId`: marcar `completed` e disparar geração de questões

### 5. Edge Function (`professor-simulado/index.ts`)

Novas actions:
- `create_study_assignment`: cria assignment + results para alunos filtrados
- `list_study_assignments`: lista atribuições do professor com contagem de status

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | 2 tabelas + RLS + security definer |
| `src/pages/ProfessorDashboard.tsx` | Nova aba "Temas de Estudo" |
| `src/pages/StudentSimulados.tsx` | Nova aba "Temas Atribuídos" + botão Tutor IA |
| `src/pages/StudySession.tsx` | Ler query params, pré-carregar contexto do professor |
| `supabase/functions/professor-simulado/index.ts` | Actions create/list study assignments |

## Resultado Esperado

- Professor indica tema + tópicos + material → alunos recebem na Proficiência
- Aluno clica "Estudar" → Tutor IA abre com tema e instruções do professor pré-carregados
- Após estudo, questões são geradas automaticamente sobre o assunto indicado

