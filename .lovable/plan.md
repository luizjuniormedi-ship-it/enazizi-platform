
Problema identificado: o micro-quiz continua sem gerar porque a chamada da função não está sendo disparada no momento certo.

O que encontrei:
- O modal `MicroQuizDialog` abre controlado pelo pai (`quizOpen` em `DailyPlan.tsx`).
- A geração do quiz hoje depende de `handleOpenChange`, ligado ao `onOpenChange` do `Dialog`.
- Quando o pai faz `setQuizOpen(true)`, o modal abre, mas esse callback não é um lugar confiável para iniciar o fetch.
- Isso bate com os sinais observados:
  - o replay mostra o modal abrindo e ficando em “Gerando questões...”
  - os logs da função `micro-quiz` só mostram boot, sem nenhuma invocação real
  - portanto o loading aparece, mas a função não chega a ser chamada

Correção proposta:
1. Mover o disparo do `generateQuiz()` para um `useEffect` baseado em `open`, `topic` e `specialty`
   - quando `open === true`, iniciar a geração
   - quando fechar, resetar estado (`questions`, `currentQ`, `selected`, `score`, `phase`)
   - impedir chamadas duplicadas se o modal re-renderizar

2. Corrigir o timeout do front
   - hoje existe `AbortController`, mas ele não é passado para `supabase.functions.invoke`, então não cancela nada
   - trocar por `Promise.race` com timeout real, como já existe em `Diagnostic.tsx`
   - se estourar tempo, fechar o modal sem travar a revisão

3. Melhorar o fluxo visual do modal
   - adicionar fase inicial `idle`
   - mostrar loading só depois que a requisição realmente começar
   - evitar ficar preso em “Gerando questões...” quando não houver request

4. Endurecer a edge function `micro-quiz`
   - aumentar `maxTokens` para reduzir risco de JSON truncado
   - validar se `content` veio preenchido antes do `parseAiJson`
   - se vier vazio ou inválido, retornar fallback controlado com log mais claro
   - manter a resposta no formato `{ questions: [...] }`

5. Corrigir o warning do dialog
   - o console mostra warning de `ref` em `DialogHeader`
   - não é a causa principal da falha, mas vale alinhar a estrutura para não introduzir ruído durante debug

Arquivos a ajustar:
- `src/components/daily-plan/MicroQuizDialog.tsx`
- `supabase/functions/micro-quiz/index.ts`
- possivelmente `src/components/ui/dialog.tsx` se eu limpar o warning do `ref`

Resultado esperado após a correção:
- ao abrir o micro-quiz, a função será chamada de fato
- as questões passam a aparecer de forma consistente
- se a IA demorar ou falhar, o aluno não fica preso no loading
- a UX continua leve e sem travar o Plano do Dia

Resumo da causa raiz:
```text
Hoje:
DailyPlan abre modal -> modal mostra loading -> fetch depende de onOpenChange -> função não dispara -> nenhuma questão é gerada

Após correção:
DailyPlan abre modal -> useEffect detecta open=true -> fetch inicia -> loading real -> quiz renderiza ou fallback seguro
```

<lov-actions>
<lov-suggestion message="Test the micro-quiz end-to-end on the Plano do Dia after the fix to confirm it opens, generates questions, and recovers correctly on timeout.">Verify that it works</lov-suggestion>
<lov-suggestion message="Implement the micro-quiz fix now by moving generation to a useEffect on modal open, adding a real timeout with Promise.race, and hardening the edge function parsing and fallback.">Corrigir micro-quiz agora</lov-suggestion>
<lov-suggestion message="Also clean up the Dialog warning in the console by reviewing the dialog header/ref structure so the modal stays stable and easier to debug.">Corrigir warning do dialog</lov-suggestion>
</lov-actions>
