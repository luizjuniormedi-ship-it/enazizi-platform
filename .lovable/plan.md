

# Nova Tela Central de Missão Diária

## Resumo
Transformar a `MissionMode.tsx` de uma lista simples de tarefas em um **plano estratégico visual** com 10 blocos informativos, integrado a todos os sistemas existentes (Study Engine, FSRS, Recovery, PrepIndex, Approval Score, chance por banca).

## Problema Atual
A missão hoje é uma tela genérica com tarefa atual + próxima + lista colapsável. Não mostra situação do aluno, diagnóstico, objetivo, impacto ou alertas — parece uma lista de tarefas, não um plano estratégico.

## Solução — 10 Componentes Novos + Reescrita do Orquestrador

### Componentes (em `src/components/mission/`)

**1. MissionSituationCard** — Situação Atual
- Grid 3 colunas: Chance por banca (useExamReadiness), PrepIndex (usePreparationIndex), Tendência (weeklyDelta)
- Badge da fase atual (Crítico/Atenção/Competitivo/Pronto)
- Frase dinâmica baseada em tendência + fase

**2. MissionDiagnosticCard** — Diagnóstico Inteligente
- Título: "O que mais impacta sua evolução hoje"
- Até 3 fatores extraídos do `adaptive`: overdueCount, recoveryMode, heavyRecovery, lockStatus, memoryPressure, streak
- Cada fator com ícone e severidade (vermelho/amarelo)
- Não aparece se tudo estiver bem

**3. MissionObjectiveCard** — Objetivo do Dia
- Frase-objetivo gerada por fase + recovery + lock
- Ex: "Corrigir seus maiores erros e reduzir o backlog de revisões"

**4. MissionTaskList** — Lista de Tarefas
- Todas as tarefas com ícone tipo, tema, tempo
- Tarefa atual destacada, concluídas com check verde

**5. MissionTaskActions** — Execução Interativa
- Card da tarefa atual com CTA `h-14` thumb-friendly "Iniciar Atividade"
- Botões "Já concluí" e "Pular"
- Usa `buildStudyPath()` existente

**6. MissionProgressFeedback** — Feedback em Tempo Real
- Barra de progresso + tempo concluído/total
- Progresso por tipo (Revisões: 2/4, Questões: 1/3)
- Mensagem motivacional dinâmica

**7. MissionImpactProjection** — Projeção de Impacto
- Estimativas: "-X revisões pendentes", "+Y% acurácia", "+Z temas"
- Baseado nos tipos de tarefa da missão

**8. MissionAlerts** — Alertas Inteligentes
- Recovery Mode → banner laranja
- Heavy Recovery → badge com fase 1-4
- Content Lock → aviso de bloqueio
- Streak zero → aviso de retomada

**9. MissionTutorHint** — Tutor IA Opcional
- Aparece apenas para tarefas de revisão/correção de erros
- Card discreto com "Quer uma explicação rápida?" + botão "Explicar"

**10. MissionContinuity** — Próximo Passo
- Preview da próxima tarefa
- Hint do que esperar amanhã baseado na fase

### Página Principal — `src/pages/MissionMode.tsx`
- Reescrita como orquestrador que monta os 10 blocos em scroll vertical
- Tela completed (vitória) preservada com melhorias visuais
- Tela paused preservada
- FocusHardMode preservado (ativação automática)
- Layout mobile-first, max-w-lg centralizado
- Top bar fixa com progresso global preservada
- Hooks consumidos: `useStudyEngine`, `useMissionMode`, `useExamReadiness`, `usePreparationIndex`, `useCoreData`

## Dados — Zero Queries Novas ao Backend
Todos os dados já existem nos hooks atuais:
- `adaptive` do Study Engine (approvalScore, mode, lockStatus, memoryPressure, overdueCount, recoveryMode, heavyRecovery)
- `state/currentTask/nextTask/progress` do useMissionMode
- `examReadiness` do useExamReadiness
- `prepIndex` do usePreparationIndex
- `gamification.current_streak` do useCoreData

## Fluxo Preservado
```text
Dashboard → startMission() → MissionMode
  → Blocos 1-3: contexto (situação + diagnóstico + objetivo)
  → Blocos 4-5: tarefas + execução
  → Bloco 6: progresso em tempo real
  → Blocos 7-8: impacto + alertas
  → Blocos 9-10: tutor + continuidade
  → Conclusão → invalidateDashboard → Dashboard
```

## Arquivos
- **Novos (10)**: `src/components/mission/MissionSituationCard.tsx`, `MissionDiagnosticCard.tsx`, `MissionObjectiveCard.tsx`, `MissionTaskList.tsx`, `MissionTaskActions.tsx`, `MissionProgressFeedback.tsx`, `MissionImpactProjection.tsx`, `MissionAlerts.tsx`, `MissionTutorHint.tsx`, `MissionContinuity.tsx`
- **Editado (1)**: `src/pages/MissionMode.tsx`

## Impacto
- Zero alteração em backend, hooks ou Study Engine
- Toda interface em pt-BR
- Mobile-first (430px viewport)
- Cards com rounded-xl, sombras suaves, cores semânticas (primary, amber, emerald, red)

