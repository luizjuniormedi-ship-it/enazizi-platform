

# Corrigir Simulado Fechando Antes do Tempo

## Problema Identificado

O `SimuladoExam` tem um bug critico no timer (linha 45): o `onFinish` é chamado dentro de um `setInterval` com uma **closure stale** — `selectedAnswers` e `flaggedQuestions` capturam os valores iniciais (`{}` e `new Set()`) porque o `useEffect` tem `[]` como dependência. Quando o timer expira, envia respostas vazias.

Mas o problema principal de "atualizar e fechar" provavelmente é causado por:

1. **Re-render do componente pai** (`Simulados.tsx`) — o `useSessionPersistence` faz auto-save a cada 30s, chamando `saveSession` que atualiza state. Isso pode causar re-render do `Simulados`, e como o `restoredState` pode mudar, o `SimuladoExam` é re-montado, reiniciando o timer.

2. **Closure stale no timer** — mesmo sem re-mount, quando o timer expira naturalmente, `selectedAnswers` está vazio (closure do mount), então `onFinish({}, [])` é chamado com 0 respostas.

3. **`timeLeft <= 0` no modo estudo** — no modo estudo, `timeSeconds` é passado como `0` (linha 589), e `initialState?.timeLeft` também pode ser `0`. O `useState` inicializa com `0`, mas a condição `timeLeft <= 0` no useEffect simplesmente retorna sem timer — isso é correto. Porém, se por algum motivo `timeLeft` for calculado errado, o timer pode disparar imediatamente.

## Solução

### 1. `src/components/simulados/SimuladoExam.tsx` — Corrigir closure stale do timer

- Usar `useRef` para `selectedAnswers` e `flaggedQuestions` no callback do timer
- Adicionar `useRef` para manter a referência atualizada de `onFinish`
- Proteger contra re-mount com ref de "já finalizado"

### 2. `src/pages/Simulados.tsx` — Estabilizar props do SimuladoExam

- Memoizar `restoredState` e `handleFinish` com `useMemo`/`useCallback` para evitar re-renders desnecessários que re-montam o componente
- Usar `key` estável no `SimuladoExam` para evitar re-mount

### 3. `src/components/simulados/SimuladoExam.tsx` — Proteção contra finalização duplicada

- Adicionar flag `finishedRef` para impedir que `onFinish` seja chamado mais de uma vez

## Mudanças Detalhadas

| Arquivo | Mudança |
|---------|---------|
| `src/components/simulados/SimuladoExam.tsx` | Usar refs para selectedAnswers/flaggedQuestions no timer; adicionar finishedRef; estabilizar onFinish |
| `src/pages/Simulados.tsx` | Memoizar handleFinish com useCallback; estabilizar restoredState com useMemo; adicionar key estável ao SimuladoExam |

