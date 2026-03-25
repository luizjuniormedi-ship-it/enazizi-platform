

# Plano: Forcar atualizacao PWA em todos os dispositivos (incluindo tablets)

## Problema

Tablets tendem a manter o PWA em segundo plano por longos periodos, impedindo que o Service Worker detecte novas versoes. O `SKIP_WAITING` enviado no login nao funciona porque o SW gerado pelo vite-plugin-pwa com `registerType: "autoUpdate"` nao escuta essa mensagem por padrao.

## Solucao

Tres mudancas para garantir que todos os dispositivos recebam atualizacoes:

### 1. Ativar `skipWaiting` no Service Worker (`vite.config.ts`)
- Adicionar `skipWaiting: true` e `clientsClaim: true` na configuracao do workbox
- Isso faz o novo SW assumir controle imediatamente sem esperar mensagem

### 2. Verificacao periodica de atualizacao (`src/main.tsx`)
- Adicionar intervalo que chama `updateSW()` a cada 10 minutos (ao inves de depender apenas do evento `onNeedRefresh`)
- Tablets que ficam abertos em background receberao a atualizacao na proxima verificacao

### 3. Verificacao ao voltar ao foco (`src/main.tsx`)
- Adicionar listener `visibilitychange` que verifica atualizacoes quando o usuario volta ao app
- Cenario tipico: tablet fica na mochila, usuario abre novamente → verifica e atualiza

## Arquivos modificados

- `vite.config.ts` — adicionar `skipWaiting: true`, `clientsClaim: true` no bloco workbox
- `src/main.tsx` — adicionar intervalo periodico (10min) + listener de visibilidade para forcar check de SW

## Impacto

Apenas configuracao PWA. Nenhuma mudanca em banco ou edge functions.

