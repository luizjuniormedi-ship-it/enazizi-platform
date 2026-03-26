

# Correção: Timeout na busca de questões reais

## Problema
A edge function `search-real-questions` está expirando (timeout) ao buscar questões de Pediatria. O Firecrawl search com `scrapeOptions` incluso faz scraping de cada resultado inline, o que pode levar mais de 60s quando há muitas páginas pesadas. A edge function atinge o limite de execução antes de completar.

## Causa raiz
1. O Firecrawl `search` com `scrapeOptions: { formats: ["markdown"] }` faz scrape de cada resultado — se uma página é um PDF grande (30k+ chars), isso demora
2. Duas buscas sequenciais (2 queries × 5 resultados cada) = até 10 páginas scrapeadas
3. Depois, a IA estrutura todo o conteúdo (timeout 90s)
4. Total pode ultrapassar facilmente 120s (limite da edge function)

## Solução

### 1. Reduzir carga do Firecrawl
- Limitar para **1 query** (não 2) por execução
- Reduzir `limit` de 5 para **3** resultados por busca
- Parar assim que encontrar 2 resultados válidos (não esperar 4)

### 2. Limitar tamanho do conteúdo
- Truncar markdown para **8000 chars** (não 12000) por fonte
- Limitar o bloco total enviado à IA para **20000 chars**

### 3. Adicionar timeout no Firecrawl
- Usar `AbortController` com 25s de timeout na chamada Firecrawl para evitar que uma única busca trave tudo

### 4. Melhorar tratamento de erro no frontend
- Capturar erro de timeout e mostrar mensagem amigável em vez de "Load failed"

## Arquivos a modificar
- `supabase/functions/search-real-questions/index.ts` — otimizar limites e adicionar timeout
- `src/components/admin/AdminWebScrapingPanel.tsx` — melhorar mensagem de erro

