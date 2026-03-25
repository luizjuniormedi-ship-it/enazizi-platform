

# Plano: Redesign Visual do Tutor IA — Interface Mais Atrativa

## Problema

A tela atual e funcional mas visualmente monotona — cards cinzas uniformes, sem hierarquia visual forte, sem animacoes envolventes, sem sensacao de "gamificacao" ou progresso motivacional.

## Mudancas Visuais Propostas

### 1. Tela Inicial — Hero Imersivo

- Substituir o hero atual por um **gradiente animado** com particulas sutis (CSS puro) que transmita energia
- Icone central maior com **animacao de pulso** mais expressiva (glow + float)
- Saudacao personalizada com nome do aluno: "Ola, {nome}! Pronto para evoluir?"
- Barra de streak/dias consecutivos abaixo do titulo (motivacional)

### 2. Grade de Temas — Cards Glassmorphism

- Cards de temas populares maiores com **efeito hover 3D** (rotateX/Y sutil)
- Emoji maior centralizado com sombra colorida por baixo
- Ao passar o mouse, card "levanta" com sombra e brilho colorido
- Adicionar secao **"Recomendado para voce"** baseada nos temas fracos (antes dos populares, com destaque visual diferente)

### 3. Stepper de Progresso — Timeline Visual

- Substituir barrinhas finas por **circulos conectados por linha** (timeline horizontal)
- Etapa atual: circulo maior, animado com pulse-glow, mostrando icone
- Etapas completas: check verde com circulo preenchido
- Etapas futuras: circulo outlined cinza
- Em mobile: mostrar apenas etapa atual destacada + contador "3 de 14"

### 4. Card de Proxima Etapa — Mais Destaque

- Gradiente de fundo colorido (nao apenas borda)
- Icone animado (float) do lado esquerdo
- Botao "Avancar" maior com gradiente primario e seta animada
- Barra de progresso circular mini mostrando % do fluxo completo

### 5. Area de Chat — Visual Premium

- Bolhas do assistente com **borda gradiente sutil** (primary → accent)
- Avatar do bot com animacao de "respiracao" quando esta pensando
- Separadores visuais entre blocos de conversa (linha gradiente fina)
- Fundo do chat com **pattern sutil** (grid pontilhado muito suave)

### 6. Metricas — Redesign Compacto

- Transformar os 4 cards em uma **barra horizontal unica** com divisores
- Cada metrica com micro icone + valor + label inline
- Cor de destaque para valores bons (verde >70%) e alertas (vermelho <50%)
- Ao expandir: graficos sparkline mini de evolucao

### 7. Input de Chat — Mais Convidativo

- Input com bordas arredondadas maiores e fundo com leve gradiente
- Placeholder rotativo com sugestoes: "Tire uma duvida...", "Peça um caso clinico...", "Explique fisiopatologia..."
- Botao de envio com gradiente e micro animacao ao enviar

### 8. Animacoes CSS Novas

- `float-gentle`: flutuacao suave para icones destaque
- `shimmer`: efeito brilho percorrendo cards (como skeleton loading premium)
- `card-3d`: hover com rotacao sutil perspectiva
- `gradient-shift`: background que muda suavemente de cor

## Arquivos a Alterar

| Arquivo | Mudanca |
|---|---|
| `src/pages/ChatGPT.tsx` | Redesign completo dos componentes visuais (hero, cards, stepper, chat, input) |
| `src/index.css` | Novas animacoes e classes utilitarias (float-gentle, shimmer, card-3d, gradient-shift, pattern-dots) |

## Resultado Visual Esperado

```text
┌──────────────────────────────────────────────────┐
│  🤖 Tutor IA Medico        [78%] [⛶] [⋮]       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  42Q | 78% acerto | 4.2/5 disc | 12 sessoes     │
│                                                    │
│  ╔════════════════════════════════════════════╗    │
│  ║  ✨ (icone flutuante grande)              ║    │
│  ║                                            ║    │
│  ║  Ola, Lucas! Pronto para evoluir?         ║    │
│  ║  🔥 5 dias consecutivos estudando         ║    │
│  ║  [__________________________] [Estudar →] ║    │
│  ╚════════════════════════════════════════════╝    │
│                                                    │
│  ⚡ Recomendado para voce:                        │
│  ╭──────╮ ╭──────╮ ╭──────╮                      │
│  │ 🫘   │ │ 🔴   │ │ 🧬   │  (cards 3D hover)   │
│  │Nefro │ │Hemato│ │Genet │                      │
│  ╰──────╯ ╰──────╯ ╰──────╯                      │
│                                                    │
│  🔥 Temas Populares:                              │
│  ╭────╮ ╭────╮ ╭────╮ ╭────╮ ╭────╮ ╭────╮      │
│  │Seps│ │IAM │ │Pneu│ │AVC │ │DM  │ │IR  │      │
│  ╰────╯ ╰────╯ ╰────╯ ╰────╯ ╰────╯ ╰────╯      │
│                                                    │
│  ── Durante sessao ──                             │
│  ○──●──○──○──○──○──○  (timeline com circulos)     │
│  ╔═══════════════════════════════════════╗         │
│  ║ 💡 Proxima: Traducao Leiga    [64%]  ║         │
│  ║ Simplificar para fixacao              ║         │
│  ║         [✨ Avancar →]                ║         │
│  ╚═══════════════════════════════════════╝         │
└──────────────────────────────────────────────────┘
```

