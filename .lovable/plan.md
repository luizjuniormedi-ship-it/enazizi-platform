

# Fase 3: Validação Médica + ErrorBank nos Módulos Faltantes

## Resumo

Adicionar `isMedicalQuestion`/`isMedicalContent` filtering e `logErrorToBank` nos módulos que ainda nao possuem.

## Situacao Atual

| Modulo | logErrorToBank | isMedicalQuestion filter |
|--------|---------------|------------------------|
| Simulados | Sim | Sim |
| ExamSimulator | Sim | Sim |
| QuestionsBank | Sim | Nao |
| Flashcards | Sim | Nao |
| PreviousExams | Sim | Nao |
| StudentSimulados | Sim | Nao |
| Diagnostic | Sim | Nao |
| AnamnesisTrainer | Nao | N/A (chat) |
| StudySession | Nao | N/A (chat) |

## Alteracoes

### 1. QuestionsBank.tsx — Adicionar filtro medico
Na linha ~122, apos mapear as questoes, aplicar `.filter(isMedicalQuestion)` antes de setar no state.

### 2. Flashcards.tsx — Adicionar filtro medico
Na linha ~122, apos merge dos cards, aplicar `.filter(c => isMedicalContent(c.question + " " + c.answer))`.

### 3. PreviousExams.tsx — Adicionar filtro medico
Na linha ~87, filtrar o retorno da query com `.filter(isMedicalQuestion)` antes de retornar.

### 4. StudentSimulados.tsx — Adicionar filtro medico
Ao montar as questoes do quiz, filtrar com `isMedicalQuestion`.

### 5. Diagnostic.tsx — Adicionar filtro medico
Na linha ~100, apos `parseQuestions`, aplicar `.filter(isMedicalQuestion)` nas questoes geradas pela IA.

### 6. AnamnesisTrainer.tsx — Adicionar ErrorBank logging
Na linha ~244, apos salvar o resultado, se `final_score < 70`, chamar `logErrorToBank` com tipo `"active-recall"`, tema = specialty, motivo = categorias nao cobertas.

### 7. StudySession.tsx — Adicionar ErrorBank logging
O StudySession e um chat streaming — nao ha processamento local de respostas. A unica informacao disponivel sao os `weakTopics` do performance. Adicionar logging quando novos weakTopics sao detectados (ao salvar performance), registrando-os como erros conceituais para alimentar o ErrorBank.

## Arquivos modificados
- `src/pages/QuestionsBank.tsx` — import + filtro
- `src/pages/Flashcards.tsx` — import + filtro
- `src/pages/PreviousExams.tsx` — import + filtro
- `src/pages/StudentSimulados.tsx` — import + filtro
- `src/pages/Diagnostic.tsx` — import + filtro
- `src/pages/AnamnesisTrainer.tsx` — import + logging
- `src/pages/StudySession.tsx` — import + logging

