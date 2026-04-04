

# Auto-iniciar Simulado com 20 Questões do Tema

## Problema
Quando o usuário clica "Questões" nas revisões pendentes, ele é levado ao Simulados com o tema pré-selecionado, mas precisa configurar manualmente e clicar "Iniciar". O ideal é que já inicie automaticamente com 20 questões do tema, dificuldade intermediária-difícil.

## Solução
Adicionar lógica de auto-start no `Simulados.tsx`: quando detectar `StudyContext` vindo do `daily-plan` com `taskType=practice`, disparar automaticamente o `handleStart` com 20 questões, dificuldade "misto" (30% intermediárias, 70% difíceis), modo "estudo".

### Arquivo: `src/pages/Simulados.tsx`
- Importar `useStudyContext` e `decodeStudyContext`
- Adicionar `useEffect` que verifica se há contexto de estudo com `source === "daily-plan"` e `taskType === "practice"`
- Se sim, chamar `handleStart` automaticamente com:
  - `topics: [ctx.specialty]`
  - `count: 20`
  - `difficulty: "misto"` (garante mix intermediário+difícil)
  - `timePerQuestion: 3`
  - `mode: "estudo"`
  - `specificTopic: ctx.topic`
- Usar ref `autoStarted` para evitar disparo duplicado
- Não disparar se houver sessão pendente (`pendingSession`)

### Arquivo: `src/pages/DailyPlan.tsx`
- Sem alteração — já passa contexto correto via URL

## Fluxo resultante
1. Usuário clica "Questões" em tema "Cardiopatias Congênitas"
2. Navega para `/dashboard/simulados?sc_source=daily-plan&sc_topic=...`
3. Simulados detecta o contexto automaticamente
4. Inicia geração de 20 questões (mix intermediário-difícil) do tema
5. Usuário já entra direto no exame, sem configurar nada

## Impacto
- Risco baixo — auto-start só ocorre com contexto explícito do daily-plan
- Sem alteração em fluxo manual (usuário que acessa Simulados diretamente continua vendo o setup)

