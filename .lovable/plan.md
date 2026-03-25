

# Plano: Busca diaria de questoes reais da internet

## Conceito

Adicionar ao `daily-question-generator` uma etapa que busca questoes reais de provas de residencia medica na internet usando o conector **Perplexity** (busca com IA), parseando o conteudo e inserindo no banco global antes da geracao por IA. A IA so complementa o que faltar.

## Fluxo proposto

```text
Cron job dispara
  → 1. Perplexity busca "questoes prova residencia medica [especialidade] 2024 2025"
  → 2. Parseia questoes encontradas (statement, options, correct_index)
  → 3. Deduplica contra banco existente (similaridade de enunciado)
  → 4. Insere questoes reais com source="web-scrape"
  → 5. Se nao atingiu 10 questoes, IA complementa (fluxo atual)
```

## Pre-requisito

Conectar o **Perplexity** ao projeto (conector disponivel). Isso injeta `PERPLEXITY_API_KEY` nas edge functions automaticamente.

## Alteracoes

### 1. Edge Function `daily-question-generator/index.ts`

- Nova funcao `searchRealQuestions(specialty, topics)`:
  - Chama Perplexity API com query em portugues focada em provas reais (REVALIDA, ENARE, USP, UNICAMP, IDOMED)
  - Pede resposta estruturada com questoes no formato JSON
  - Filtra e valida: enunciado >= 150 chars, 4 alternativas, tem indice correto
  - Remove duplicatas contra `existingStatements` (primeiros 80 chars)
- Modificar `generateForSpecialty`:
  - Primeiro chama `searchRealQuestions` para obter questoes reais
  - Insere as reais com `source: "web-real"`
  - Calcula quantas faltam para chegar a 10
  - So gera via IA o complemento necessario
- Adicionar campo `source` no log para distinguir questoes reais vs geradas

### 2. Prompt Perplexity

Busca academica (`search_mode: "academic"`) com filtro de data recente, pedindo questoes no formato JSON estruturado com caso clinico, alternativas, resposta correta e explicacao.

## Limitacoes

- Sites de provas podem nao ter questoes em formato facilmente parseavel — a IA do Perplexity ajuda a estruturar
- Nem toda busca retornara questoes validas — o fallback para geracao IA garante que sempre atingimos a meta
- Creditos Perplexity serao consumidos (1 chamada por especialidade = 2 chamadas por execucao do cron)

## Arquivos a modificar

- `supabase/functions/daily-question-generator/index.ts` — adicionar busca Perplexity + logica de complemento

