

# Corrigir Fontes em Inglês no Web Scraping de Questões Reais

## Problema
O `search-real-questions` ainda busca em sites internacionais (AMBOSS, USMLE, lecturio, geekymedics), inserindo questões em inglês no `questions_bank`. Essas questões depois aparecem nos simulados.

## Correções

### 1. Remover queries internacionais do `buildQueryPool`
**Arquivo:** `supabase/functions/search-real-questions/index.ts`

Remover as linhas 276-281 que contêm:
- `site:amboss.com`
- `site:radiopaedia.org`
- `site:geekymedics.com`
- `site:lecturio.com`
- USMLE step 2 questions
- medical residency exam MCQ

Substituir por mais fontes brasileiras diversificadas.

### 2. Remover domínios internacionais do TRUSTED_DOMAINS
Remover da lista (linhas 39-43):
- amboss.com, usmle.org, nbme.org, lecturio.com, osmosis.org, kenhub.com, geekymedics.com, passmedicine.com

Manter apenas domínios de referência acadêmica internacional (PubMed, BMJ, NEJM, Lancet, Medscape, Radiopaedia) — estes são referências bibliográficas, não fontes de questões.

### 3. Adicionar filtro de idioma nas questões extraídas
No `structureQuestions`, adicionar ao prompt:
- "IDIOMA OBRIGATÓRIO: Todas as questões devem estar em PORTUGUÊS BRASILEIRO. Descarte qualquer questão em inglês ou outro idioma."

### 4. Adicionar validação de idioma no filtro de questões
Na função de validação (linha 493), adicionar check:
- Se o enunciado contém padrões típicos de inglês (`/\b(the|patient|which|following)\b/i` em proporção alta), rejeitar.

### 5. Limpar questões em inglês já existentes no banco
Executar query para identificar e remover questões web-scrape com enunciado em inglês.

### 6. Redeploy da edge function

## Arquivos alterados
- `supabase/functions/search-real-questions/index.ts`

## Resultado esperado
- Zero questões em inglês entram no banco
- Scraping focado 100% em fontes brasileiras
- Questões existentes em inglês removidas

