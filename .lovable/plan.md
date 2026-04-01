

# Ativar Microfone no Tutor

## Situação Atual

O hook `useSpeechToText` já existe e funciona com a Web Speech API (pt-BR). O `TutorInputBar` atualmente só tem campo de texto + botão enviar, sem botão de microfone.

## Mudanças

### 1. `src/components/tutor/TutorInputBar.tsx`

- Adicionar props `isListening`, `hasSpeechRecognition`, `onToggleListening`
- Adicionar botão de microfone (`Mic` / `MicOff` do lucide-react) entre o Input e o botão Send
- Quando `isListening`, o botão pulsa com animação (ring vermelho) para indicar gravação ativa
- Só exibir o botão se `hasSpeechRecognition` for true

### 2. `src/pages/ChatGPT.tsx`

- Importar e usar `useSpeechToText`, passando callback que preenche o input com o texto transcrito
- Passar as props do speech-to-text para o `TutorInputBar`

### Resultado

Botão de microfone ao lado do campo de texto. Ao clicar, escuta o usuário em português e preenche automaticamente o campo de input com a transcrição.

