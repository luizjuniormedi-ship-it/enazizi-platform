

# Botão Toggle de Áudio no Vídeo Hero

## Alteração: `src/components/landing/HeroSection.tsx`

Adicionar um botão flutuante no canto inferior direito do vídeo que permite ligar/desligar o som:

1. **Estado**: `const [isMuted, setIsMuted] = useState(true)` — inicia mudo (necessário para autoplay funcionar)
2. **Ref**: `useRef<HTMLVideoElement>` no elemento `<video>` para controlar `muted` via ref
3. **Botão**: Ícone `Volume2` (som ligado) / `VolumeX` (mudo) do Lucide, posicionado `absolute bottom-6 right-6 z-20` com fundo semi-transparente (`bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full p-3`)
4. **Propriedade `muted`** do `<video>` controlada pelo estado `isMuted`

Apenas 1 arquivo alterado.

