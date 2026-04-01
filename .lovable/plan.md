

# Agendamento de Simulados + Auto-atribuição de Novos Alunos

## Problema

Atualmente, o simulado é publicado imediatamente ao ser criado e só atribui alunos que já existem na plataforma naquele momento. Alunos que se cadastram depois ficam sem acesso.

## Mudanças

### 1. Migração — Adicionar colunas de agendamento

```sql
ALTER TABLE public.teacher_simulados
  ADD COLUMN scheduled_at timestamptz DEFAULT NULL,
  ADD COLUMN auto_assign boolean DEFAULT true;
```

- `scheduled_at`: data/hora em que o simulado fica disponível (NULL = imediato)
- `auto_assign`: se true, novos alunos que se enquadrem nos filtros (faculdade/período) são automaticamente atribuídos

### 2. `ProfessorDashboard.tsx` — UI de agendamento

- Adicionar campo de data/hora (input `datetime-local`) no formulário de criação
- Mostrar relógio/countdown nos simulados agendados na lista
- Badge visual: "Agendado para DD/MM às HH:MM" ou "Disponível agora"
- Toggle "Auto-atribuir novos alunos" (default: ativado)

### 3. `professor-simulado/index.ts` — Salvar agendamento

- No `create_simulado`: salvar `scheduled_at` e `auto_assign`
- Se `scheduled_at` futuro, status = `"scheduled"` em vez de `"published"`
- No `list_simulados`: incluir `scheduled_at` e `auto_assign` na resposta

### 4. Edge Function `auto-assign-simulados` (CRON — a cada 15 min)

Novo job que:
1. Busca simulados com `auto_assign = true` e `status IN ('published', 'scheduled')`
2. Se `scheduled_at` passou e status é `'scheduled'`, atualiza para `'published'`
3. Para cada simulado com `auto_assign = true`:
   - Busca alunos ativos que correspondem ao `faculdade_filter` e `periodo_filter`
   - Compara com `teacher_simulado_results` existentes
   - Insere resultado `pending` para alunos novos que ainda não foram atribuídos

### 5. Lado do aluno — Filtrar por disponibilidade

No `StudentSimulados.tsx` ou onde os alunos veem simulados: filtrar para mostrar apenas simulados com `status = 'published'` e `scheduled_at IS NULL OR scheduled_at <= now()`.

### 6. CRON job (pg_cron + pg_net)

Agendar chamada à `auto-assign-simulados` a cada 15 minutos para:
- Publicar simulados agendados cuja hora chegou
- Atribuir novos alunos a simulados com `auto_assign = true`

## Resultado

- Professor agenda simulado para data/hora específica com countdown visual
- Novos alunos que se cadastram e se enquadram nos filtros recebem automaticamente o simulado
- Transição automática de "agendado" para "publicado" na hora certa

