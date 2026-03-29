

# ENAZIZI 2.0 — Plano de Evolução Incremental

## Visão geral

Transformar a plataforma de "coleção de módulos independentes" para um **sistema com motor de decisão central (Study Engine)** que conecta desempenho, erros, revisões, simulados e prática clínica — sem quebrar nada.

## Fases de implementação

---

### FASE 1 — Study Engine (núcleo de decisão)

**O que é**: Um serviço central que analisa todos os dados do aluno e decide o que ele deve estudar agora.

**Arquivos a criar**:
- `src/lib/studyEngine.ts` — Lógica pura que consulta `practice_attempts`, `error_bank`, `revisoes`, `temas_estudados`, `desempenho_questoes`, `anamnesis_results` e `exam_sessions` para gerar recomendações priorizadas
- `src/hooks/useStudyEngine.ts` — React Query hook que expõe as recomendações

**Lógica do motor**:
```text
┌─────────────────────────────────────────┐
│            STUDY ENGINE                 │
│                                         │
│  Inputs:                                │
│  ├─ practice_attempts (acertos/erros)   │
│  ├─ error_bank (temas fracos)           │
│  ├─ revisoes (pendentes/atrasadas)      │
│  ├─ desempenho_questoes (taxa_acerto)   │
│  ├─ anamnesis_results (scores)          │
│  ├─ exam_sessions (simulados)           │
│  └─ temas_estudados (progresso)         │
│                                         │
│  Output: StudyRecommendation[]          │
│  ├─ type: review|practice|clinical|new  │
│  ├─ topic + specialty                   │
│  ├─ priority (0-100)                    │
│  ├─ reason (texto explicativo)          │
│  ├─ targetModule (tutor|questoes|flash  │
│  │   cards|plantao|anamnese|simulado)   │
│  └─ estimatedMinutes                    │
└─────────────────────────────────────────┘
```

**Impacto zero**: Nenhum módulo existente é alterado. O engine é apenas um novo serviço que lê dados existentes.

---

### FASE 2 — Smart Planner (substituição incremental do Cronograma)

**O que é**: Nova página `/dashboard/planner` que usa o Study Engine para gerar planos automáticos, coexistindo com o cronograma atual.

**Arquivos a criar**:
- `src/pages/SmartPlanner.tsx` — Interface do planner com dois modos:
  - **Modo Guiado**: o sistema monta o plano do dia automaticamente
  - **Modo Livre**: o aluno escolhe o que estudar, mas vê sugestões do engine
- `src/components/planner/PlannerDayView.tsx` — Visão do dia com blocos
- `src/components/planner/PlannerSuggestions.tsx` — Sugestões do engine
- `src/components/planner/PlannerModeToggle.tsx` — Toggle guiado/livre

**Arquivos a editar**:
- `src/App.tsx` — Adicionar rota `/dashboard/planner`
- `src/components/layout/DashboardSidebar.tsx` — Adicionar item "Planner" no menu
- `src/components/layout/DashboardLayout.tsx` — Adicionar no menu mobile

**Regra**: O cronograma atual (`/dashboard/cronograma`) permanece intacto e acessível. O Planner é uma alternativa nova.

---

### FASE 3 — Integração dos módulos com o Study Engine

**O que é**: Conectar os módulos existentes para receberem contexto do engine.

**Arquivos a editar**:
- `src/pages/Dashboard.tsx` — Substituir `SmartRecommendations` pelas recomendações do Study Engine
- `src/pages/DailyPlan.tsx` — Usar Study Engine como fonte de dados para blocos do dia (fallback para lógica atual se engine vazio)
- `src/components/dashboard/SmartRecommendations.tsx` — Refatorar para consumir `useStudyEngine()`

**Novos componentes**:
- `src/components/dashboard/StudyEngineWidget.tsx` — Widget compacto no dashboard: "O que estudar agora" com 1 clique para iniciar

**Regra**: Toda mudança mantém fallback. Se o engine não retornar dados, o comportamento atual é preservado.

---

### FASE 4 — Acionamento automático de Plantão e Anamnese

**O que é**: O Study Engine pode sugerir sessões de Plantão ou Anamnese quando detecta que o aluno precisa de prática clínica.

**Lógica**:
- Se o aluno tem acurácia alta em teoria (>75%) mas poucas sessões clínicas → sugerir Plantão
- Se o aluno estudou semiologia recentemente mas não praticou anamnese → sugerir Anamnese
- Se o aluno errou questões clínicas → sugerir caso clínico no Plantão

**Arquivos a editar**:
- `src/lib/studyEngine.ts` — Adicionar regras clínicas
- `src/components/planner/PlannerSuggestions.tsx` — Renderizar sugestões clínicas com navegação direta

**Nenhuma alteração** nos módulos Plantão e Anamnese — apenas o engine os sugere.

---

### FASE 5 — Transição suave do Cronograma para Planner

**O que é**: Migrar gradualmente usuários do cronograma para o planner.

**Ações**:
- Adicionar banner no cronograma: "Experimente o novo Planner Inteligente"
- Importar temas do cronograma para o Planner automaticamente
- Manter cronograma funcional indefinidamente (sem data de remoção)

---

## Resumo de entregas por fase

| Fase | Entrega | Risco |
|------|---------|-------|
| 1 | Study Engine (serviço puro) | Zero — só lê dados |
| 2 | Smart Planner (nova página) | Baixo — nova rota |
| 3 | Dashboard + DailyPlan usam engine | Baixo — com fallback |
| 4 | Sugestões clínicas automáticas | Zero — só sugestões |
| 5 | Banner de migração | Zero — informativo |

## Proposta

Implementar a **Fase 1** agora (Study Engine). Após validação, avançar para a Fase 2.

