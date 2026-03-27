

# Plano: Corrigir integração do Avatar 3D e Voz no Tutor Principal

## Problema
O Tutor principal (`/dashboard/chatgpt` → `ChatGPT.tsx`) é um componente separado de 1271 linhas que **não** usa o `AgentChat.tsx`. Por isso, as funcionalidades de Avatar 3D, auto-fala e microfone não estão disponíveis no Tutor — apenas nos agentes secundários (Feynman, Coach, etc.).

Além disso, a página `AIMentor.tsx` existe mas não tem rota registrada.

## Solução

### 1. Adicionar Avatar 3D e Voz ao ChatGPT.tsx
Integrar no Tutor principal as mesmas funcionalidades já presentes no `AgentChat.tsx`:
- Importar `TutorAvatar3D` e `useLipSync`
- Adicionar estados `showAvatar3D`, `autoSpeak`, `isListening`
- Adicionar no menu ⋮ as opções "Mostrar Avatar 3D" e "Ativar auto-fala"
- Adicionar botão de microfone (STT) ao lado do input
- Adicionar botão de alto-falante (TTS) em cada resposta do assistente
- Renderizar o canvas 3D acima do chat quando ativado

### 2. Registrar rota do AIMentor
- Adicionar `<Route path="mentor" element={<AIMentor />} />` no `App.tsx`

## Arquivos
- Editar: `src/pages/ChatGPT.tsx` (adicionar avatar 3D, STT, TTS, auto-fala)
- Editar: `src/App.tsx` (adicionar rota `/dashboard/mentor`)

