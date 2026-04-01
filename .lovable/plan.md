

# Números Reais no Painel Admin — Questões Reais vs Geradas por IA

## Problema

Os painéis "Buscar Questões Reais" e "Questões Geradas Hoje" não mostram a distinção entre questões reais (de provas oficiais) e questões geradas por IA. O admin não sabe quantas são de cada tipo.

**Dados atuais no banco**: 6.747 questões globais — 1.443 reais (21%) e 5.304 geradas por IA (79%).

## Mudanças

### 1. `src/components/admin/AdminDailyGenerationAlert.tsx`

Renomear para **"Questões no Banco Hoje"** e adicionar contagem separada:

- Buscar questões criadas hoje com campo extra para classificar: `exam_bank_id IS NOT NULL OR source_type = 'indexed_external' OR source_url IS NOT NULL` = real
- Exibir:
  - **Total hoje**: N questões
  - **Reais (provas oficiais)**: N — badge verde
  - **Geradas por IA**: N — badge azul
- Adicionar resumo geral do banco abaixo: "Total no banco: X questões (Y reais / Z IA)"

### 2. `src/components/admin/AdminWebScrapingPanel.tsx`

Adicionar métricas do banco de questões reais:

- Query ao total de questões com `source_type = 'indexed_external' OR exam_bank_id IS NOT NULL OR source_url IS NOT NULL`
- Exibir no topo do painel:
  - **Total de questões reais no banco**: N
  - **Total de questões IA no banco**: N
  - **% real**: badge com percentual
- Após scraping, mostrar também `scraping_runs` recentes com `questions_accepted` vs `questions_rejected`

### 3. Edge function — sem mudanças

Os dados já existem no banco. Toda a lógica é client-side com queries ao `questions_bank`.

## Detalhes técnicos

- Classificação de "real": `exam_bank_id IS NOT NULL OR source_type = 'indexed_external' OR source_url IS NOT NULL`
- Classificação de "IA": tudo que não se encaixa acima
- Queries filtram `is_global = true` para contar apenas questões do banco global
- Nenhuma migração necessária

