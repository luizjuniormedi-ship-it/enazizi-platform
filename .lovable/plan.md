

# Plano: Anti-Repetição de Questões e Flashcards (100+ únicos)

## Problema
Ao sair e voltar ao gerador de questões/flashcards, a IA não sabe o que já gerou anteriormente, resultando em repetições.

## Solução
Adicionar prop `previousContentLoader` ao `AgentChat` que carrega as últimas 100 questões/flashcards do usuário e injeta como contexto anti-repetição no `userContext` enviado à IA.

## Mudanças

### 1. `src/components/agents/AgentChat.tsx`
- Nova prop opcional: `previousContentLoader?: () => Promise<string>`
- No `useEffect` inicial, chamar o loader e guardar resultado em `useRef`
- No `buildUserContext`, anexar o conteúdo carregado ao contexto
- Invalidar cache após `onSaveMessage` bem-sucedido (para incluir novas questões no próximo envio)

### 2. `src/pages/QuestionGenerator.tsx`
- Criar função `loadPreviousQuestions` que busca últimas 100 questões do `questions_bank` (onde `source = 'gerador-ia'`)
- Extrai `statement` (80 chars) + `topic` de cada
- Formata como: `"⛔ QUESTÕES JÁ GERADAS (NÃO REPETIR):\n1. [Cardiologia] Paciente 45a com dor..."`
- Passar como `previousContentLoader`

### 3. `src/pages/FlashcardGenerator.tsx`
- Criar função `loadPreviousFlashcards` que busca últimos 100 flashcards
- Extrai `question` (80 chars) + `topic`
- Formata como: `"⛔ FLASHCARDS JÁ GERADOS (NÃO REPETIR):\n1. [Cardiologia] Qual tratamento..."`
- Passar como `previousContentLoader`

### 4. `supabase/functions/question-generator/index.ts`
- Adicionar ao system prompt: se contexto incluir `QUESTÕES JÁ GERADAS`, nunca gerar cenários clínicos similares

### 5. `supabase/functions/generate-flashcards/index.ts`
- Adicionar ao system prompt: se contexto incluir `FLASHCARDS JÁ GERADOS`, nunca repetir cenários similares

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/agents/AgentChat.tsx` | Nova prop `previousContentLoader`, injeção no contexto |
| `src/pages/QuestionGenerator.tsx` | Loader de últimas 100 questões |
| `src/pages/FlashcardGenerator.tsx` | Loader de últimos 100 flashcards |
| `supabase/functions/question-generator/index.ts` | Instrução anti-repetição cross-session |
| `supabase/functions/generate-flashcards/index.ts` | Instrução anti-repetição cross-session |

