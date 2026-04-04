
# Nova Tela Central de Missão Diária

## Visão Geral
Transformar a página `MissionMode.tsx` de uma lista simples de tarefas em um **plano estratégico visual** com 10 blocos informativos, mantendo toda a lógica existente do Study Engine, FSRS, Recovery e hooks.

## Arquitetura
A página atual (353 linhas) será reescrita como orquestrador de **sub-componentes independentes**. O hook `useMissionMode` e o `useStudyEngine` já fornecem todos os dados necessários — nenhuma lógica de backend precisa mudar.

## Componentes Novos (todos em `src/components/mission/`)

### 1. `MissionSituationCard.tsx` — Situação Atual
- Consome `useExamReadiness` (chance por banca), `usePreparationIndex` (PrepIndex), `adaptive.mode` (fase)
- Calcula tendência comparando `approvalScore` atual vs `approval_scores` da semana anterior (já em `coreData`)
- Frase dinâmica gerada por fase + tendência

### 2. `MissionDiagnosticCard.tsx` — Diagnóstico Inteligente
- Título: "O que mais impacta sua evolução hoje"
- Lista até 3 fatores extraídos de: `adaptive.lockReasons`, `adaptive.overdueCount`, `adaptive.recoveryMode`, `adaptive.heavyRecovery`, erros do Study Engine
- Cada fator com ícone e cor (vermelho/amarelo)

### 3. `MissionObjectiveCard.tsx` — Objetivo do Dia
- Gera frase-objetivo baseada em `adaptive.mode.phase` + `adaptive.recoveryMode` + `heavyRecovery.phase`
- Ex: "Corrigir erros críticos e reduzir backlog" (fase crítica) ou "Consolidar cardiologia com simulado" (competitivo)

### 4. `MissionTaskList.tsx` — Missão do Dia (Tarefas)
- Reutiliza `state.tasks` do `useMissionMode` (já ordenado pelo Study Engine)
- Cada item mostra: ícone tipo, tema, objetivo curto, tempo estimado, badge de prioridade
- Item atual destacado com borda primária

### 5. `MissionTaskActions.tsx` — Execução Interativa
- Botões "Iniciar Atividade", "Já concluí", "Pular" (mesma lógica atual)
- Usa `buildStudyPath()` para navegação contextual
- CTA principal com `h-14` thumb-friendly

### 6. `MissionProgressFeedback.tsx` — Feedback em Tempo Real
- Barra de progresso + contadores (X/Y revisões, X/Y questões)
- Agrupa tarefas por tipo e mostra progresso por categoria
- Mensagens motivacionais baseadas em % concluído

### 7. `MissionImpactProjection.tsx` — Projeção de Impacto
- Calcula estimativas simples: `-(overdueCount que serão resolvidos)` revisões, `+X%` estimado na chance
- Baseado nos tipos de tarefa pendentes (review reduz overdue, practice melhora accuracy)

### 8. `MissionAlerts.tsx` — Alertas Inteligentes
- Recovery Mode → banner laranja com `recoveryReason`
- Heavy Recovery → badge com fase atual (1-4) e `phaseDescription`
- Content Lock → aviso de bloqueio
- Dias sem estudar (via `gamification.current_streak === 0`)

### 9. `MissionTutorHint.tsx` — Tutor IA Opcional
- Aparece apenas se a tarefa atual é tipo `error_review` com `vezes_errado >= 3`
- Card discreto: "Quer uma explicação rápida?" + botão "Explicar agora" → navega para tutor com contexto

### 10. `MissionContinuity.tsx` — Próximo Passo
- Mostra `nextTask` (já disponível no hook)
- Se missão quase completa: "Amanhã o foco será..." (baseado na fase do Study Engine)

## Página Principal — `src/pages/MissionMode.tsx`

Reescrita como orquestrador:
- Tela `completed` (vitória) preservada com melhorias visuais
- Tela `paused` preservada
- Tela `active` reorganizada como scroll vertical com os 10 blocos
- `FocusHardMode` preservado (ativação automática para prova próxima / score baixo)
- Layout: scroll vertical mobile-first, max-w-lg centralizado

## Dados — Zero Queries Novas
Todos os dados já existem nos hooks:
- `useStudyEngine()` → `adaptive` (approvalScore, weights, mode, lockStatus, memoryPressure, overdueCount, recoveryMode, heavyRecovery)
- `useMissionMode()` → `state`, `currentTask`, `nextTask`, `progress`, `completedMinutes`
- `useExamReadiness()` → chance por banca
- `usePreparationIndex()` → prepIndex, zone, delta
- `useCoreData()` → gamification streak, approvalScores histórico

## Fluxo Preservado
```text
Dashboard (HeroStudyCard) → startMission() → MissionMode
  → Bloco 1-3: contexto visual (situação + diagnóstico + objetivo)
  → Bloco 4-5: tarefas + execução (buildStudyPath → módulos)
  → Bloco 6: progresso em tempo real
  → Bloco 7-8: impacto + alertas
  → Bloco 9-10: tutor opcional + continuidade
  → Conclusão: tela vitória → invalidateDashboard → Dashboard
```

## Arquivos
- **Novos** (10): `src/components/mission/MissionSituationCard.tsx`, `MissionDiagnosticCard.tsx`, `MissionObjectiveCard.tsx`, `MissionTaskList.tsx`, `MissionTaskActions.tsx`, `MissionProgressFeedback.tsx`, `MissionImpactProjection.tsx`, `MissionAlerts.tsx`, `MissionTutorHint.tsx`, `MissionContinuity.tsx`
- **Editado** (1): `src/pages/MissionMode.tsx` — reescrita como orquestrador dos sub-componentes

## UI/UX
- Mobile-first (430px viewport atual do usuário)
- Cards com `rounded-xl`, sombras suaves, espaçamento `space-y-3`
- Cores: primary para CTA, amber para alertas, emerald para progresso, red para crítico
- Toda interface em pt-BR
- Top bar fixa com progresso global (preservada)
