

# Plano: Integrar Persistência de Sessão no Tutor IA, Flashcards e Sessão de Estudo

## Problema
A persistência de sessão só foi integrada em 3 módulos (Simulação Clínica, Simulado de Provas, Anamnese). Faltam os 3 restantes: **Tutor IA (ChatGPT)**, **Flashcards** e **Sessão de Estudo**.

## Mudanças

### 1. `src/pages/ChatGPT.tsx`
- Importar `useSessionPersistence` + `ResumeSessionBanner`
- module_key: `"chatgpt"`
- Estado salvo: `messages`, `currentTopic`, `enaziziStep`, `performance`, `selectedUploadIds`
- Banner no topo da área de chat quando há sessão pendente
- Auto-save registrado com `registerAutoSave`
- Ao restaurar: repopular messages, currentTopic, enaziziStep

### 2. `src/pages/Flashcards.tsx`
- module_key: `"flashcards"`
- Estado salvo: `idx`, `mode`, `flipped`, `selectedTopics`
- Banner no topo quando há sessão pendente
- Marcar `completed` ao terminar revisão

### 3. `src/pages/StudySession.tsx`
- module_key: `"study-session"`
- Estado salvo: `messages`, `phase`, `performanceData`, `currentTopic`
- Banner no topo quando há sessão pendente

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ChatGPT.tsx` | Integrar hook + banner + auto-save |
| `src/pages/Flashcards.tsx` | Integrar hook + banner + auto-save |
| `src/pages/StudySession.tsx` | Integrar hook + banner + auto-save |

Nenhuma mudança no banco de dados — a tabela `module_sessions` já existe.

