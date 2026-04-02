

# Notificações do Painel do Professor para Alunos

## Resumo
Quando o professor criar uma atividade (simulado, caso clínico ou tema de estudo), cada aluno atribuído receberá uma mensagem no sistema (`admin_messages`). Para simulados agendados, criar também um lembrete 2h antes do início via cron job.

## Alterações

### 1. Edge Function `professor-simulado/index.ts` — Inserir notificações
Nos 3 cases de criação (`create_simulado`, `create_clinical_case`, `create_study_assignment`), após inserir os results dos alunos, inserir uma `admin_messages` para cada aluno atribuído:

- **Simulado**: "📋 Novo Simulado: {title} — {total_questions} questões, tempo: {time_limit}min. Acesse a aba Proficiência para realizar."
- **Caso Clínico**: "🏥 Novo Caso Clínico: {title} — Especialidade: {specialty}. Acesse a aba Proficiência para realizar."
- **Tema de Estudo**: "📚 Nova Atribuição: {title} — Tópicos: {topics}. Acesse a aba Proficiência para estudar."

Cada mensagem será inserida com `sender_id = professor user.id` e `recipient_id = student_id`.

### 2. Nova Edge Function `professor-reminder` — Lembrete 2h antes
Função simples que:
1. Busca simulados com `scheduled_at` entre agora e agora+5min (janela do cron)
2. Para cada simulado, busca os alunos em `teacher_simulado_results` com status `pending`
3. Insere `admin_messages` com lembrete: "⏰ Lembrete: O simulado '{title}' começa em 2 horas!"

### 3. Cron Job — Executar a cada 5 minutos
Agendar `professor-reminder` a cada 5 minutos. A função verifica simulados cujo `scheduled_at` está entre `now() + 115min` e `now() + 125min` (janela de 2h ± 5min).

## Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/professor-simulado/index.ts` | Inserir `admin_messages` nos 3 cases de criação |
| `supabase/functions/professor-reminder/index.ts` | Nova função para lembrete 2h antes |
| Cron Job (SQL insert) | Agendar `professor-reminder` a cada 5 minutos |

