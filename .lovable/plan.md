

# Persistir Respostas no Simulado do Professor (StudentSimulados)

## Problema
O `StudentSimulados.tsx` tem seu próprio quiz inline **sem nenhuma persistência de sessão**. Se o aluno fechar a tela ou atualizar, perde todas as respostas. Além disso, o timer tem o mesmo bug de stale closure que foi corrigido no `Simulados.tsx`.

## Solução

### 1. `src/pages/StudentSimulados.tsx` — Adicionar persistência + corrigir timer

**Persistência:**
- Importar e usar `useSessionPersistence` com `moduleKey: "student-simulados"`
- No `startQuiz`, verificar se há sessão pendente e restaurar `answers`, `questionIndex`, `timeLeft`
- Registrar `registerAutoSave` com callback que retorna `{ answers, questionIndex, timeLeft, resultId, simuladoId }`
- No `handleSubmit`, chamar `completeSession()`
- No `backToList`, chamar `abandonSession()` se necessário
- Adicionar banner de recuperação (usar `ResumeSessionBanner` existente ou lógica inline) quando `pendingSession` existir

**Correção do timer (mesmo padrão do SimuladoExam):**
- Usar `useRef` para `answers` e `handleSubmit` para evitar stale closures
- Adicionar `finishedRef` para impedir submit duplicado
- Remover `timeLeft > 0` da dependência do useEffect (causa restart do timer a cada segundo)

### 2. Restauração inteligente ao reabrir

- Quando o aluno volta à página e há sessão ativa em `module_sessions`:
  - Verificar se o `teacher_simulado_results` correspondente ainda está `in_progress`
  - Se sim, restaurar `answers`, `questionIndex`, `timeLeft` e retomar o quiz
  - Se o simulado já foi completado/expirado, descartar a sessão

## Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/pages/StudentSimulados.tsx` | Integrar `useSessionPersistence`; corrigir timer com refs; restaurar estado ao reabrir; proteger contra submit duplicado |

