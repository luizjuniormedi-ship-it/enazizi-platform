

# Plano: Adicionar todos os topicos do Ciclo Clinico ao buscador de questoes

## Problema
O buscador de questoes reais (`search-real-questions`) e o painel admin so cobrem 14 especialidades. Faltam 7 do Ciclo Clinico: Angiologia, Oftalmologia, Oncologia, Ortopedia, Otorrinolaringologia, Psiquiatria e Urologia.

## Alteracoes

### 1. Edge Function `search-real-questions/index.ts`
- Atualizar `SPECIALTIES_POOL` (linha 402) para incluir as 7 especialidades faltantes
- Total passara de 14 para 21 especialidades

### 2. Painel Admin `AdminWebScrapingPanel.tsx`
- Atualizar a lista `SPECIALTIES` (linha 9) para incluir as mesmas 7 especialidades
- Manter ordem alfabetica para facilitar selecao

### Resultado
- Busca automatica (cron) passara a cobrir todas as 17 especialidades do Ciclo Clinico + Internato
- Admin podera disparar buscas manuais para qualquer especialidade
- Flashcards serao gerados automaticamente para as novas areas

