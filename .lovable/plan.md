

# Plano: Compactar UI de navegacao para maximizar area de chat

## Problema

O card "Proxima etapa" (que mostra "Traducao Leiga", "Fisiopatologia", etc.) e o timeline stepper de 14 passos ocupam muito espaco vertical, reduzindo a area de conversa.

## Mudancas no arquivo `src/pages/ChatGPT.tsx`

### 1. Compactar o Step Tracker + Next Phase em uma unica barra horizontal
- Substituir o timeline stepper (14 circulos) + card de proxima etapa (com icone grande, descricao e progresso circular) por uma **barra compacta de 1 linha** com:
  - Barra de progresso fina (height 4px) mostrando etapa atual/14
  - Texto inline: "📚 Tema | Etapa 3/14 - Traducao Leiga"
  - Botao "Avancar" compacto ao lado
  - Botoes "Pular para Questoes" e "Consolidacao" como links pequenos na mesma linha

### 2. Esconder detalhes em tooltip/dropdown
- A descricao completa da etapa e o icone grande vao para um tooltip ao passar o mouse no nome da etapa
- O progresso circular (%) vira texto simples ("21%") na barra

### 3. Resultado estimado
- Economia de ~120px verticais (de ~160px para ~40px)
- Toda essa area ganha a tela de mensagens do chat

## Impacto

Apenas visual/layout. Nenhuma logica de negocio, edge function ou banco de dados alterado. A funcionalidade de avancar etapas permanece identica.

