

# Plano: Voz Premium ElevenLabs (sem avatar)

## Resumo
Integrar ElevenLabs TTS para que todas as explicações do tutor possam ser ouvidas com voz natural em português brasileiro. Sem avatar — apenas áudio premium.

## Implementação

### 1. Conectar ElevenLabs e adicionar API key
- Usar `add_secret` para `ELEVENLABS_API_KEY`
- Voz padrão: Daniel (`onwK4e9ZLuTAKqWW03F9`) — masculina, PT-BR natural

### 2. Criar Edge Function `elevenlabs-tts`
- Recebe `text` do frontend
- Normaliza texto (remove markdown, expande abreviações médicas)
- Chama ElevenLabs API com `eleven_multilingual_v2`
- Retorna áudio MP3 binário
- Voice settings: stability 0.5, similarity_boost 0.75, style 0.3 (tom professor)

### 3. Atualizar `multimediaService.ts`
- Remover toda lógica de avatar (generateAvatar, avatar_video_url, etc.)
- `generateAudio()` passa a chamar a edge function via `fetch()`
- Cache por hash do texto (reusa áudio já gerado)
- Estados: idle → generating → ready → error

### 4. Simplificar `MultimediaControls.tsx`
- Remover botão "Assistir explicação" e modal do avatar cinemático
- Manter apenas botão **"Ouvir explicação"** com controles:
  - Play / Pause / Replay
  - Velocidade: 1x, 1.1x, 1.25x, 1.5x, 2x
- Playback via `<audio>` element (não Web Speech API)
- Estados visuais: "Gerando áudio...", ícone de erro

### 5. Atualizar `ChatGPT.tsx`
- Remover imports e referências ao `CinematicAvatar` e `TutorAvatar3D`
- Remover toggle "Mostrar Avatar 3D" do menu
- Manter `MultimediaControls` em cada resposta do assistente

## Arquivos
- Criar: `supabase/functions/elevenlabs-tts/index.ts`
- Editar: `src/lib/multimediaService.ts` (remover avatar, usar edge function)
- Editar: `src/components/agents/MultimediaControls.tsx` (remover avatar modal, simplificar)
- Editar: `src/pages/ChatGPT.tsx` (remover avatar 3D/cinemático)

