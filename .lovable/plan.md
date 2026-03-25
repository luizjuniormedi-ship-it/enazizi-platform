

# Plano: Pacote de Melhorias e Correções (16 itens)

## Prioridade Alta (Bugs/Correções)

### 1. Dashboard — Streak não reconhece simulado/plantão
**Problema**: O `addXp` em `useGamification.ts` atualiza o streak, mas módulos como Simulados e Plantão podem não estar chamando `addXp` consistentemente. Além disso, o streak só conta `practice_attempts`, ignorando `exam_sessions` e `simulation_history`.
**Correção**: Garantir que `addXp` é chamado em todos os módulos (simulados, plantão, anamnese) e que o DailyGoalWidget conta questões de simulados (`exam_sessions`) além de `practice_attempts`.

### 2. Dashboard — Meta diária não evolui
**Problema**: `DailyGoalWidget` conta apenas `practice_attempts`. Questões respondidas em simulados (`exam_sessions.answers_json`) e questões interativas em chat não são contabilizadas.
**Correção**: Somar `practice_attempts` + questões de `exam_sessions` finalizadas hoje na query do widget.

### 3. Jornada 7 dias — Não reconhece Nivelamento
**Problema**: `OnboardingChecklist` usa `hasCompletedDiagnostic` que é passado como `false` hardcoded no Dashboard.
**Correção**: No `useDashboardData`, buscar `profiles.has_completed_diagnostic` e passá-lo para o componente.

### 4. Simulados — Botão descartar sessão não funciona
**Problema**: O `abandonSession` do `useSessionPersistence` é chamado mas o `SimuladoSetup` pode não estar conectando o `onDiscard` ao `abandonSession` corretamente.
**Correção**: Verificar e corrigir o fluxo de discard no `SimuladoSetup`, garantindo que chama `abandonSession` + `clearPending`.

### 5. Nivelamento — Só responde A ou B
**Problema**: O prompt do Diagnostic não intercala gabaritos suficientemente. O `correct_index` gerado pela IA tende a ser 0 ou 1.
**Correção**: Adicionar instrução explícita no prompt para distribuir `correct_index` entre 0-4 uniformemente, e validar no parse que os gabaritos estão distribuídos.

### 6. Gerador de questões — Erro na contagem BI
**Problema**: A contagem de questões por usuário no painel admin BI pode estar usando a tabela errada ou não filtrando corretamente.
**Correção**: Investigar `AdminBIPanel` e corrigir a query de contagem.

## Prioridade Média (Melhorias de UX)

### 7. Termômetro de aprovação — Mover para cima
**Correção**: No `Dashboard.tsx`, mover o `ApprovalThermometer` para logo após o `DashboardMetricsGrid`, antes dos charts pesados.

### 8. Nivelamento — Condizente com ciclo acadêmico
**Problema**: O Diagnostic usa 8 áreas fixas independente do período do aluno.
**Correção**: Buscar `profiles.periodo` e filtrar AREAS por ciclo (1-4 período = Ciclo Básico; 5-8 = Clínico; 9-12 = Internato). Usar áreas condizentes com cada ciclo.

### 9. Resumidor — Padronizar com TutorZizi
**Correção**: Alinhar o prompt do `content-summarizer` com o protocolo ENAZIZI do `enazizi-prompt.ts`, incluindo mesma estrutura de referências e formato de resposta.

### 10. TutorZizi — Diminuir área de checkpoints
**Correção**: Reduzir o tamanho visual dos checkpoints no componente de chat do agente (provavelmente em `AgentChat.tsx`), usando padding/font menores.

### 11. Gerador de questões — Gabarito comentado + repetir caso + explicação leigo
**Correção**: Atualizar o prompt do `question-generator` para incluir: (a) explicação detalhada citando o livro de referência, (b) repetição do caso clínico no gabarito, (c) seção "Explicação Simplificada" em linguagem acessível.

### 12. Discursivas — Separar perguntas
**Correção**: No módulo de discursivas, apresentar cada sub-pergunta em card/seção separada em vez de bloco único.

### 13. Anamnese — Mostrar perguntas feitas
**Correção**: Adicionar painel lateral (similar ao prontuário do Plantão) que lista todas as perguntas já feitas pelo aluno durante a anamnese.

### 14. Plantão — Intervenções externas
**Correção**: Adicionar no prompt do `clinical-simulation` instruções para inserir intervenções externas (enfermagem interrompe, familiar chega, resultado de exame inesperado) para aumentar realismo.

### 15. Plantão — Excluir histórico individual
**Correção**: Adicionar botão de exclusão individual em cada item do histórico de plantões (`simulation_history`).

### 16. Cadastro — Médico: especialidade + onde formou
**Problema**: Quando `user_type = "medico"`, o perfil não pede especialidade nem faculdade de formação.
**Correção**: No `Profile.tsx`, quando `userType === "medico"`, mostrar campo de especialidade médica (Select com lista de especialidades) e campo "Onde formou" (FaculdadeCombobox). Adicionar colunas `specialty` (já existe como `target_specialty`) e reutilizar `faculdade` para médicos também.

## Arquivos a modificar

- `src/hooks/useDashboardData.ts` — buscar `has_completed_diagnostic` do perfil
- `src/pages/Dashboard.tsx` — passar diagnostic flag, reposicionar termômetro
- `src/components/dashboard/DailyGoalWidget.tsx` — somar exam_sessions na meta
- `src/components/dashboard/OnboardingChecklist.tsx` — usar flag real
- `src/hooks/useGamification.ts` — garantir contagem correta
- `src/pages/Simulados.tsx` — corrigir discard session
- `src/pages/Diagnostic.tsx` — filtrar áreas por ciclo, melhorar distribuição gabarito
- `src/pages/Profile.tsx` — campos médico (especialidade + faculdade)
- `src/components/admin/AdminBIPanel.tsx` — corrigir contagem questões
- `supabase/functions/question-generator/index.ts` — gabarito comentado
- `supabase/functions/content-summarizer/index.ts` — padronizar com TutorZizi
- `supabase/functions/clinical-simulation/index.ts` — intervenções externas
- `src/components/agents/AgentChat.tsx` — reduzir checkpoints
- `src/pages/DiscursiveQuestions.tsx` — separar perguntas
- `src/pages/ClinicalSimulation.tsx` — excluir histórico individual
- `src/pages/AnamnesisTrainer.tsx` — painel de perguntas feitas

## Sugestão de execução

Dividir em 3-4 sprints por prioridade. Recomendo começar pelos itens 1-6 (bugs) que impactam a experiência direta do usuário.

