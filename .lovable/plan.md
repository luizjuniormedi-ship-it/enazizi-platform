

# Melhorias Recomendadas

Após análise do código, identifiquei 5 melhorias prioritárias:

## 1. Error Boundary Global
O app não tem Error Boundary. Se qualquer componente crashar, a tela fica branca sem feedback. Criar um `ErrorBoundary` React que capture erros e mostre uma tela de recuperação com botão "Recarregar".

- Criar: `src/components/layout/ErrorBoundary.tsx`
- Editar: `src/App.tsx` (envolver Routes com ErrorBoundary)

## 2. Cache de Artigos PubMed (performance)
Cada mensagem nos agentes faz 3 chamadas à API PubMed (esearch + esummary + efetch), mesmo para temas repetidos. Adicionar um cache em memória simples (Map com TTL de 10min) no `pubmed-search.ts` para evitar buscas duplicadas na mesma sessão da edge function.

- Editar: `supabase/functions/_shared/pubmed-search.ts`

## 3. Feedback Visual de Carregamento nos Agentes
Quando o agente está buscando artigos PubMed + gerando resposta, o usuário só vê "..." sem indicação do que está acontecendo. Adicionar indicadores de etapa ("Buscando referências científicas...", "Gerando resposta...").

- Editar: `src/components/agents/AgentChat.tsx` (mensagem de loading contextual)

## 4. Fallback Offline para PWA
O app tem `manifest.json` e página Install, mas não tem Service Worker registrado. Sem ele, o app não funciona offline. Adicionar um SW básico com cache de assets estáticos.

- Criar: `public/sw.js`
- Editar: `src/main.tsx` (registrar SW)

## 5. Rate Limiting Visual no Chat
Se o usuário enviar muitas mensagens rápidas, pode receber erro 429 sem explicação clara. Adicionar debounce no botão de envio (2s cooldown) e mensagem amigável quando rate limited.

- Editar: `src/components/agents/AgentChat.tsx`

## Ordem de Implementação
1. Error Boundary (previne tela branca)
2. Cache PubMed (performance imediata)
3. Feedback de loading (UX)
4. Rate limiting visual (UX)
5. Service Worker offline (PWA)

## Arquivos
- Criar: `src/components/layout/ErrorBoundary.tsx`, `public/sw.js`
- Editar: `src/App.tsx`, `src/main.tsx`, `src/components/agents/AgentChat.tsx`, `supabase/functions/_shared/pubmed-search.ts`

