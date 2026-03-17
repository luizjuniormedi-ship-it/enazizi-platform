

# Treinamento de Anamnese com IA

## Conceito
Criar um modo **"Treino de Anamnese"** onde a IA simula um paciente e o aluno precisa conduzir a entrevista clínica completa (queixa principal, HDA, antecedentes, hábitos, revisão de sistemas). A IA só revela informações quando o aluno faz as perguntas certas — treinando a técnica semiológica.

## Diferença do Modo Plantão
O Plantão é um atendimento completo (anamnese + exame + exames + conduta). O Treino de Anamnese foca **exclusivamente** na coleta de história clínica, com avaliação detalhada da técnica de entrevista.

## Implementação

### 1. Edge Function: `anamnesis-trainer/index.ts`
Nova edge function com prompt especializado:
- **Papel da IA**: Paciente realista que responde apenas ao que é perguntado
- **Comportamento**: Não entrega informações espontaneamente; se o aluno não pergunta sobre alergias, a IA não menciona
- **Início** (`action="start"`): Gera paciente com queixa principal vaga (ex: "Doutor, tô com uma dor aqui"), dados ocultos completos (HDA, antecedentes, medicações, alergias, hábitos, história familiar, revisão de sistemas)
- **Interação** (`action="interact"`): Responde como paciente, trackeia quais categorias o aluno cobriu
- **Finalização** (`action="finish"`): Avalia em 8 categorias: Identificação, Queixa Principal, HDA (cronologia, caracterização, fatores de melhora/piora), Antecedentes Pessoais, Medicações, Alergias, Hábitos de Vida, História Familiar, Revisão de Sistemas
- Retorna checklist do que foi perguntado vs. o que faltou, com nota e feedback

### 2. Frontend: `src/pages/AnamnesisTr trainer.tsx`
- Lobby: escolher especialidade e dificuldade
- Interface de chat simplificada (sem ações rápidas de exame/prescrição — só conversa)
- Sidebar com checklist visual das categorias cobertas (atualizado em tempo real)
- Timer opcional (sem pressão como no plantão)
- Tela de resultado: checklist detalhado, nota por categoria, anamnese "ideal" gerada pela IA

### 3. Rota e Navegação
- Nova rota `/dashboard/anamnese` no `App.tsx`
- Card no `AgentsHub.tsx` com ícone de entrevista
- Também acessível via sidebar

### 4. Banco de Dados
- Salvar resultados na tabela `simulation_history` existente com `specialty` marcado como "Anamnese - [Especialidade]"
- Ou criar tabela `anamnesis_results` dedicada (user_id, specialty, categories_covered jsonb, final_score, ideal_anamnesis text, created_at)
- Recomendo tabela dedicada para métricas específicas de anamnese

### 5. Tabela `anamnesis_results`
```sql
create table public.anamnesis_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  specialty text not null,
  difficulty text not null default 'intermediário',
  categories_covered jsonb not null default '{}',
  final_score integer default 0,
  grade text default 'F',
  ideal_anamnesis text,
  conversation_history jsonb default '[]',
  time_total_minutes integer default 0,
  xp_earned integer default 0,
  created_at timestamptz not null default now()
);
alter table public.anamnesis_results enable row level security;
-- Users can CRUD own results
create policy "Users can CRUD own anamnesis" on public.anamnesis_results
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Admins can read all
create policy "Admins can read all anamnesis" on public.anamnesis_results
  for select to authenticated using (has_role(auth.uid(), 'admin'));
```

## Resumo de Entregas
1. Migration: tabela `anamnesis_results` com RLS
2. Edge function `anamnesis-trainer` com prompt de paciente simulado
3. Página `AnamnesisTrainer.tsx` com chat + checklist lateral
4. Rota `/dashboard/anamnese` + card no Hub de Agentes
5. Deploy e teste

