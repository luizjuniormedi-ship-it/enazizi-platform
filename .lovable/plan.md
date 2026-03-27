

# Plano: Voz bidirecional no Tutor IA

## O que será feito
Adicionar dois botões ao chat: um **microfone** para o usuário falar (speech-to-text) e um **alto-falante** em cada resposta do tutor para ouvir a resposta (text-to-speech). Tudo usando APIs nativas do navegador — sem custo extra e sem API keys.

## Como funciona

### 🎤 Usuário fala → Texto
- Botão de microfone ao lado do botão de enviar
- Usa `Web Speech API` (`SpeechRecognition`) nativa do navegador
- Reconhecimento contínuo em português (`pt-BR`)
- O texto reconhecido preenche o campo de input automaticamente
- Indicador visual pulsante quando está gravando

### 🔊 Tutor fala → Áudio
- Botão de alto-falante em cada mensagem do assistente
- Usa `Web Speech Synthesis API` (`speechSynthesis`) nativa do navegador
- Voz em português brasileiro
- Botão muda para "parar" enquanto está falando

## Detalhes técnicos

### Editar `src/components/agents/AgentChat.tsx`
- Adicionar estado `isListening` e `isSpeaking`
- Criar função `toggleListening()` que inicia/para o `SpeechRecognition`
- Criar função `speakText(text)` que usa `SpeechSynthesisUtterance` com `lang: 'pt-BR'`
- Adicionar botão `Mic` ao lado do botão Send (com animação pulsante quando ativo)
- Adicionar botão `Volume2` em cada mensagem do assistente (ao lado do Copy)
- Detectar suporte do navegador e esconder botões se não suportado

## Arquivos
- Editar: `src/components/agents/AgentChat.tsx`

