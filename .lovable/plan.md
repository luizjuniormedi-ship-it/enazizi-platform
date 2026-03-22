

# Plano: Adicionar "Continuar de Onde Parou" no AgentChat

## Problema
O `AgentChat` (usado por QuestionGenerator, FlashcardGenerator, MentorMed, MotivationalCoach, MedicalReviewer, InterviewSimulator, ContentSummarizer) não tem `useSessionPersistence`. Os 6 módulos que já têm são páginas independentes (ChatGPT, Flashcards, ExamSimulator, etc.).

## Solução
Integrar `useSessionPersistence` diretamente no componente `AgentChat.tsx`, usando `functionName` como `moduleKey`. Isso cobre **7 módulos** de uma vez.

## Mudanças em `src/components/agents/AgentChat.tsx`

1. Importar `useSessionPersistence` e `ResumeSessionBanner`
2. Chamar `useSessionPersistence({ moduleKey: functionName })` 
3. Registrar auto-save com `registerAutoSave` — salva `messages` e `activeConversationId`
4. Mostrar `ResumeSessionBanner` no topo do chat quando:
   - `pendingSession` existe
   - Chat está no estado inicial (apenas welcome message)
5. Ao clicar "Continuar": restaurar `messages` e `activeConversationId` do `session_data`
6. Ao clicar "Descartar": chamar `abandonSession()`
7. Ao criar nova conversa ou limpar chat: chamar `completeSession()`

| Arquivo | Mudança |
|---------|---------|
| `src/components/agents/AgentChat.tsx` | Adicionar persistência de sessão universal |

