

# Plano: Redesign do Tutor IA para Maior Atratividade e Usabilidade

## Problemas Identificados

1. **Tela inicial fria** — apenas um input de texto, sem guia visual ou sugestoes de temas
2. **Barra de progresso confusa** — 14 barrinhas minusculas sem contexto, usuario nao entende onde esta
3. **Botoes de fase escondidos** — aparece apenas 1 botao por vez, usuario nao sabe o que vem depois
4. **Sem onboarding** — usuario novo nao sabe como o fluxo funciona
5. **Visual monotono** — sem cards coloridos, sem icones grandes, sem animacoes suaves
6. **Metricas ocupam espaco fixo** — 4 cards sempre visiveis mesmo durante o chat

## Mudancas Propostas

### 1. Tela Inicial Redesenhada
- Hero com ilustracao/icone grande animado e texto motivacional
- **Grade de sugestoes rapidas** com 8-12 temas populares em cards coloridos clicaveis (Sepse, IAM, Pneumonia, Diabetes, etc.)
- Secao "Temas Fracos" com destaque visual forte (badge vermelho)
- Secao "Continuar Estudando" se houver sessao anterior
- Input de busca com autocomplete das especialidades cadastradas

### 2. Barra de Progresso Visual (Step Tracker)
- Substituir as 14 barrinhas por um **stepper horizontal compacto** com icones e labels visiveis
- Mostrar etapa atual com destaque, etapas completas com check, futuras em cinza
- Tooltip ao passar o mouse explicando cada etapa
- Versao colapsavel em mobile (mostra so a etapa atual + proxima)

### 3. Cards de Acao Contextual
- Em vez de 1 botao por vez, mostrar um **card de proxima etapa** destacado com:
  - Titulo da proxima fase
  - Descricao curta do que vai acontecer
  - Botao grande e colorido "Avancar"
- Adicionar botoes de atalho: "Pular para Questoes", "Ir para Consolidacao"

### 4. Welcome/Onboarding para Novos Usuarios
- Modal ou card inline na primeira visita explicando o fluxo em 3 passos:
  1. Escolha um tema
  2. Aprenda em blocos (tecnico + leigo)
  3. Teste com questoes e casos clinicos
- Checkbox "Nao mostrar novamente"

### 5. Chat Bubble Melhorado
- Adicionar avatar animado do tutor (icone Bot com glow)
- Typing indicator com animacao de 3 pontos
- Feedback visual ao acertar/errar (flash verde/vermelho na tela)
- Botao de "copiar" e "salvar" em cada mensagem do assistente

### 6. Painel de Metricas Colapsavel
- Metricas colapsam automaticamente quando a sessao inicia (mais espaco para chat)
- Pequeno badge no header mostrando acuracia em tempo real
- Expandir ao clicar

## Arquivos a Alterar

| Arquivo | Mudanca |
|---|---|
| `src/pages/ChatGPT.tsx` | Redesign completo da tela inicial (hero, sugestoes, stepper, cards de acao, metricas colapsaveis, onboarding) |
| `src/index.css` | Animacoes CSS novas (pulse-glow, fade-slide-up) |

## Resultado Visual Esperado

```text
┌─────────────────────────────────────────────────┐
│  🎓 Tutor IA Medico                    [⛶] [...] │
│  ┌─ Metricas (colapsavel) ─────────────────┐    │
│  │ 42Q  78%  4.2/5  12 sessoes             │    │
│  └─────────────────────────────────────────-┘    │
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │     🩺                                   │     │
│  │  O que voce quer estudar hoje?           │     │
│  │  [_______________________________] [Ir]  │     │
│  │                                          │     │
│  │  Sugestoes Populares:                    │     │
│  │  [🫀 Sepse] [🫁 Pneumonia] [💉 IAM]     │     │
│  │  [🧠 AVC]  [🦴 Fraturas]  [👁 Glaucoma] │     │
│  │                                          │     │
│  │  ⚠️ Temas Fracos: [Nefro] [Hemato]      │     │
│  │  📖 Continuar: Cardiologia (78%)        │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ── Durante a sessao ──                          │
│  [1✓][2✓][3●][4○][5○]...[13○]  Etapa 3/13       │
│  ┌──────────────────────────────────────┐        │
│  │ 🔬 Proxima: Traducao Leiga           │        │
│  │ O tutor vai simplificar o conteudo    │        │
│  │ [💡 Avancar para Traducao Leiga]      │        │
│  └──────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

