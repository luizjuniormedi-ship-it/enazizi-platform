

# Plano: Corrigir contabilizacao de atividades e reposicionar Termometro

## Problemas identificados

1. **StreakCalendar** so consulta `practice_attempts` para marcar dias ativos — ignora `exam_sessions`, `simulation_history`, `anamnesis_results`, `teacher_simulado_results`
2. **DailyGoalWidget** so conta `practice_attempts` + `exam_sessions` — ignora simulados de professor e plantoes
3. **OnboardingChecklist** usa `hasCompletedDiagnostic` do perfil mas esse flag pode nao estar sendo atualizado apos o nivelamento
4. **ApprovalThermometer** esta posicionado abaixo dos KPIs em vez de no topo

## Alteracoes

### 1. `src/components/dashboard/StreakCalendar.tsx`
- Adicionar queries paralelas para `exam_sessions` (finished_at), `simulation_history` (created_at), `anamnesis_results` (created_at), `teacher_simulado_results` (created_at)
- Unir todas as datas no Set `activityDays` para que qualquer atividade marque o dia como ativo

### 2. `src/components/dashboard/DailyGoalWidget.tsx`
- Adicionar query para `teacher_simulado_results` (hoje) e `simulation_history` (hoje)
- Somar total_questions dos simulados de professor + contar simulacoes clinicas como questoes equivalentes (ex: 1 plantao = 5 questoes)

### 3. `src/components/dashboard/OnboardingChecklist.tsx`
- O item "diagnostic" ja usa `hasCompletedDiagnostic` que vem de `profiles.has_completed_diagnostic`
- Verificar se a pagina Diagnostic esta atualizando esse flag — adicionar fallback checando `diagnostic_results` count > 0

### 4. `src/pages/Dashboard.tsx`
- Mover `<ApprovalThermometer>` para antes do grid Streak+DailyGoal (logo apos SmartRecommendations, dentro do bloco `!isNewUser`)

## Arquivos a modificar
- `src/components/dashboard/StreakCalendar.tsx`
- `src/components/dashboard/DailyGoalWidget.tsx`
- `src/components/dashboard/OnboardingChecklist.tsx`
- `src/pages/Dashboard.tsx`

