

# Plano: Avatar Cinemático Oficial do Tutor

## Resumo
Substituir o avatar 3D procedural pelo personagem enviado pelo usuário como avatar oficial da plataforma, criando uma experiência cinematográfica premium de "professor particular" com narração, lip-sync visual e apresentação de alta qualidade.

## Abordagem
Como não temos um serviço de vídeo-avatar real (ex: HeyGen, Synthesia), a solução será uma **apresentação cinemática estática + animada** usando a imagem do personagem com efeitos visuais premium (breathing, glow, parallax sutil) sincronizados com a narração TTS do navegador. Isso cria a percepção de um avatar falante sem custo de API externo, mantendo a estrutura pronta para integração futura com serviços de vídeo-avatar.

## Implementação

### 1. Salvar imagem do avatar oficial
- Copiar `IMG_8629.jpeg` para `src/assets/tutor-cinematic-avatar.png`
- Este será o avatar oficial em toda a plataforma

### 2. Criar componente `CinematicAvatar.tsx`
Novo componente que substitui o `TutorAvatar3D` no modal de "Assistir explicação":
- Fundo com gradiente escuro premium (studio acadêmico moderno)
- Avatar centralizado com enquadramento cinematográfico (medium shot)
- Efeitos quando falando: pulsação sutil, glow ao redor, ondas de áudio animadas
- Efeito de "breathing" idle quando não está falando
- Área de legendas na parte inferior
- Controles de playback elegantes (play, pause, replay, velocidade 1x/1.25x/1.5x/2x)
- Grading de cor premium com vinheta sutil

### 3. Atualizar `MultimediaControls.tsx`
- Renomear botão "Avatar" → **"Assistir explicação"**
- Renomear botão "Ouvir" → **"Ouvir explicação"**
- Adicionar label "Ler explicação" implícito (texto já visível)
- No modal: substituir `TutorAvatar3D` pelo novo `CinematicAvatar`
- Loading states elegantes: "Preparando tutor...", "Gerando explicação narrada..."
- Modal maior e mais cinematográfico com aspect ratio 16:9
- Legendas sincronizadas word-by-word durante narração
- Velocidades: 1x, 1.25x, 1.5x, 2x

### 4. Atualizar `ChatGPT.tsx`
- Substituir o bloco `TutorAvatar3D` inline por uma versão compacta do avatar cinemático
- Manter a imagem do avatar nos balões de mensagem como já está
- Remover dependência do `TutorAvatar3D` e `useLipSync` do componente principal (movidos para dentro do CinematicAvatar)

### 5. Atualizar tipagens em `multimediaService.ts`
- Adicionar `avatar_style: "cinematic"` como padrão
- Adicionar velocidade 1.25x às opções
- Manter estrutura de cache e status existente

## Componente Visual do CinematicAvatar

```text
┌─────────────────────────────────────────┐
│  ░░░░░░░░░  FUNDO CINEMATOGRÁFICO ░░░░░│
│  ░░ gradiente escuro + vinheta sutil ░░░│
│                                         │
│         ┌─────────────────┐             │
│         │                 │             │
│         │   AVATAR IMG    │  ← glow    │
│         │   (personagem)  │    pulsante │
│         │                 │             │
│         └─────────────────┘             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  "Explicação narrada aqui..."   │    │
│  └─────────────────────────────────┘    │
│                                         │
│     ◄◄   ▶/❚❚   ►►   🔄   1.5x        │
└─────────────────────────────────────────┘
```

## Arquivos
- Copiar: `IMG_8629.jpeg` → `src/assets/tutor-cinematic-avatar.png`
- Criar: `src/components/agents/CinematicAvatar.tsx`
- Editar: `src/components/agents/MultimediaControls.tsx`
- Editar: `src/pages/ChatGPT.tsx`
- Editar: `src/lib/multimediaService.ts` (adicionar speed 1.25x)

