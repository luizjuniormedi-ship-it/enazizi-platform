

# Plano: Avatar 3D Falante com Lip-Sync no Tutor IA

## Conceito
Adicionar um avatar 3D animado que fala automaticamente as respostas do tutor, com lip-sync baseado em visemas. O avatar será renderizado com React Three Fiber + Ready Player Me e sincronizado com o Web Speech API (TTS) já implementado.

## Abordagem técnica

### 1. Modelo 3D — Ready Player Me
- Usar um modelo `.glb` gratuito do Ready Player Me com blend shapes (visemas) para animação labial
- O modelo será hospedado em `public/models/tutor-avatar.glb`
- Blend shapes padrão RPM incluem: `viseme_aa`, `viseme_E`, `viseme_I`, `viseme_O`, `viseme_U`, `viseme_FF`, `viseme_TH`, `viseme_SS`, etc.

### 2. Componente `TutorAvatar3D`
- Criar `src/components/agents/TutorAvatar3D.tsx`
- Usar `@react-three/fiber@^8.18` e `@react-three/drei@^9.122.0` (versões compatíveis com React 18)
- Canvas Three.js com o modelo GLB carregado via `useGLTF`
- Props: `isSpeaking: boolean` — quando true, anima os visemas ciclicamente
- Animação de idle (leve balanço/respiração) quando não está falando
- Fundo transparente para integrar no chat

### 3. Lip-Sync com Web Speech API
- Aproveitar o TTS já implementado (`window.speechSynthesis`)
- Usar eventos `onboundary` do `SpeechSynthesisUtterance` para detectar palavras sendo faladas
- Mapear fonemas para blend shapes do modelo RPM
- Fallback: animação cíclica de boca quando `onboundary` não disponível

### 4. Integração no AgentChat
- Exibir o avatar 3D acima ou ao lado do chat quando o tutor está falando
- Auto-play: quando nova resposta chega, o avatar automaticamente fala (TTS + lip-sync)
- Toggle para ativar/desativar auto-play
- O avatar fica em idle com animação sutil quando não está falando

### 5. Fallback
- Se WebGL não disponível, manter o avatar 2D estático atual
- Detectar suporte com `document.createElement('canvas').getContext('webgl2')`

## Arquivos

- Instalar: `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0`, `three@^0.160`
- Criar: `src/components/agents/TutorAvatar3D.tsx`
- Criar: `src/hooks/useLipSync.ts` (lógica de mapeamento fonema→visema)
- Editar: `src/components/agents/AgentChat.tsx` (integrar avatar 3D + auto-speak)
- Adicionar: modelo GLB em `public/models/` (Ready Player Me genérico ou criar um personalizado)

## Limitação
- Precisaremos de um modelo `.glb` com blend shapes. Podemos usar um modelo RPM genérico gratuito ou você pode criar um personalizado em readyplayer.me e me enviar o link.

