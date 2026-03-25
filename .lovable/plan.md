

# Plano: Busca de Questoes Reais via Firecrawl + Web Scraping

## Problema
A IA generativa nao tem acesso a bancos de provas reais e fabrica fontes. Precisamos buscar conteudo de fontes oficiais publicadas na web.

## Abordagem
Usar o conector **Firecrawl** (ja disponivel no workspace) para scraping de sites que publicam provas de residencia medica com acesso publico, e processar o conteudo extraido via IA para estruturar as questoes.

## Fontes Publicas Conhecidas
- **INEP/REVALIDA**: Provas disponibilizadas publicamente pelo governo
- **Residenciamedicasp.com.br**: Agregador de provas de SP
- **Sites de universidades**: USP, UNICAMP, UNIFESP publicam gabaritos e cadernos de prova
- **SUS-SP (Acesso Direto)**: Provas disponiveis no portal oficial

## Implementacao

### 1. Linkar Firecrawl ao projeto
Conectar o conector Firecrawl ja existente no workspace.

### 2. Criar Edge Function `search-real-questions`
- Recebe: especialidade, banca (opcional), ano (opcional)
- Usa Firecrawl Search para buscar PDFs/paginas com questoes reais
- Usa Firecrawl Scrape para extrair o conteudo das paginas encontradas
- Passa o conteudo extraido para a IA estruturar em formato `questions_bank`
- Salva com `source: "web-scrape"` e metadata real (URL de origem, banca, ano)

### 3. Integrar no `daily-question-generator`
- Fase 1 (nova): chamar `search-real-questions` para buscar questoes reais da web
- Fase 2 (existente): complementar com `ai-exam-style` para atingir a meta

### 4. Adicionar botao no Admin
- Botao "Buscar Questoes Reais" no painel admin para disparar buscas manuais por especialidade/banca

## Detalhes Tecnicos

**Edge Function `search-real-questions/index.ts`:**
```text
1. Firecrawl Search: query = "prova residencia medica {especialidade} {banca} questoes"
2. Filtrar resultados por dominio confiavel
3. Firecrawl Scrape: extrair markdown das paginas encontradas
4. IA: estruturar texto bruto em JSON de questoes (statement, options, answer, explanation)
5. Validar: difficulty >= 3, tamanho >= 250 chars, conteudo clinico
6. Inserir em questions_bank com source = "web-scrape", metadata = { url, banca, ano }
```

**Metadados de rastreabilidade:**
- `source`: `"web-scrape"`
- `exam_source`: URL real de onde foi extraido
- Sem fontes inventadas — tudo rastreavel

## Resultado Esperado
- Questoes com origem verificavel (URL real)
- Conteudo autentico de provas publicadas
- Complemento honesto ao gerador diario

