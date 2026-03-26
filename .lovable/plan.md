

# Plano: Corrigir timeout na busca de questões reais

## Problema
A edge function `search-real-questions` faz múltiplas buscas Firecrawl sequenciais (cada uma com timeout de 20s), totalizando até 60-80s. O browser aborta a conexão com "Load failed" antes da resposta chegar.

## Solução

### 1. Frontend: adicionar AbortController com timeout de 120s (`src/components/admin/AdminWebScrapingPanel.tsx`)
- Adicionar `AbortController` com `setTimeout` de 120 segundos no `searchSingle`
- Melhorar mensagem de erro para timeout: "A busca pode levar até 2 minutos. Tente novamente."

### 2. Edge function: reduzir tempo total (`supabase/functions/search-real-questions/index.ts`)
- Reduzir timeout do Firecrawl de 20s para 12s por query
- Limitar a 4 queries tentadas (em vez de iterar todas até achar 2 resultados)
- Adicionar timeout global de 55s na função (edge functions tem limite de 60s) — se atingir, retornar o que já processou
- Executar as queries Firecrawl em paralelo (2 de cada vez) em vez de sequencialmente

### 3. Bulk search: aumentar delay entre calls
- Aumentar delay de 2s para 4s no bulk para evitar rate limiting

## Resultado
- Função completa em <55s mesmo com queries lentas
- Frontend não aborta prematuramente
- Se algumas queries falharem por timeout, o resultado parcial é retornado

## Arquivos
- Editar: `src/components/admin/AdminWebScrapingPanel.tsx`
- Editar + deploy: `supabase/functions/search-real-questions/index.ts`

