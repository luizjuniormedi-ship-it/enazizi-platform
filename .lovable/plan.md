
# Plano: Corrigir Avisos do Sistema para Refletir a Realidade

## Problemas Identificados

### 1. Health Check (Admin) — Contagem de questões por especialidade está errada
A edge function `system-health-check` busca questões com `eq("topic", "Cardiologia")`, mas os tópicos reais são armazenados como subtópicos: "Cardiologia - Arritmias", "Cardiologia - Doença Coronariana", etc. Resultado: o sistema sempre reporta "especialidades com poucas questões" mesmo tendo centenas. Precisa usar `ilike` com pattern matching.

### 2. DashboardWarnings — Depende de dados que a maioria dos usuários não tem
- `todayTotal` vem do `weeklySchedule` do plano de estudo. Se o usuário não criou um plano, `todayTotal = 0` e os avisos de "não estudou hoje" nunca aparecem.
- `totalTasks` conta `study_tasks`, mas a atividade real dos alunos está em `practice_attempts`, `exam_sessions`, `chat_conversations`. O aviso "cronograma ficando para trás" não reflete o uso real.
- Precisa considerar atividade real (questões respondidas, sessões de chat, simulados) além do cronograma.

### 3. SmartNotifications — Meta diária arbitrária
- Default `meta_questoes_dia = 30` quando o usuário não configurou. Muitos alunos novos recebem "você fez 0% da meta" sem nunca terem definido meta.

## Mudanças

### Editar `supabase/functions/system-health-check/index.ts`
- Trocar `eq("topic", spec)` por `ilike("topic", `${spec}%`)` para capturar subtópicos
- Ajustar threshold: contar todas as questões que começam com o nome da especialidade

### Editar `src/components/dashboard/DashboardWarnings.tsx`
- Aceitar novos props: `questionsToday`, `hasStudyPlan`
- Adicionar aviso baseado em atividade real (0 questões respondidas hoje após meio-dia)
- Só mostrar avisos de cronograma se o usuário tem plano de estudo ativo
- Adicionar aviso para quem não tem cronograma configurado

### Editar `src/pages/Dashboard.tsx`
- Passar os novos props (`questionsToday` dos metrics, `hasStudyPlan`)

### Editar `src/hooks/useDashboardData.ts`
- Adicionar contagem de `questionsToday` (practice_attempts de hoje)
- Adicionar flag `hasStudyPlan` baseado na existência de plano

### Editar `src/components/dashboard/SmartNotifications.tsx`
- Só mostrar alerta de meta diária se o usuário configurou `meta_questoes_dia` explicitamente
- Remover default arbitrário de 30

## Arquivos
- Editar + deploy: `supabase/functions/system-health-check/index.ts`
- Editar: `src/components/dashboard/DashboardWarnings.tsx`
- Editar: `src/pages/Dashboard.tsx`
- Editar: `src/hooks/useDashboardData.ts`
- Editar: `src/components/dashboard/SmartNotifications.tsx`
