

# Plano: Priorizar questoes de bancas reais no consumo

## Problema
Atualmente os 3 modulos de questoes tratam todas as fontes igualmente:
- **ExamSimulator**: busca do `questions_bank` com shuffle aleatorio
- **QuestionsBank**: ordena por data de criacao
- **Simulados**: gera 100% via IA, ignora o banco existente

Questoes de fontes externas (`web-scrape`, `real-exam-ai`, provas reais) tem qualidade superior mas nao sao priorizadas.

## Solucao

### 1. ExamSimulator — priorizar fontes reais (`src/pages/ExamSimulator.tsx`)
- Apos buscar as questoes do banco (linha 94-112), ordenar por prioridade de fonte antes do shuffle:
  - Prioridade 1: `web-scrape`, `real-exam-ai` (questoes reais extraidas)
  - Prioridade 2: `ai-exam-style` (geradas imitando bancas)
  - Prioridade 3: `daily-auto`, demais fontes
- Selecionar as N primeiras por prioridade, depois shuffle entre elas
- Adicionar coluna `source` na query (atualmente nao busca `source`)

### 2. Simulados — usar banco primeiro, complementar com IA (`src/pages/Simulados.tsx`)
- Antes de gerar via IA, buscar questoes do `questions_bank` que correspondam aos temas selecionados
- Priorizar fontes reais (`web-scrape`, `real-exam-ai`) sobre geradas
- Gerar via IA apenas a diferenca (se o banco tem 6 de 10, gerar apenas 4)
- Manter deduplicacao: comparar com `practice_attempts` do usuario para nao repetir questoes ja respondidas

### 3. QuestionsBank — ordenar por fonte (`src/pages/QuestionsBank.tsx`)
- Adicionar opcao de ordenacao "Questoes reais primeiro"
- Default: priorizar `web-scrape` e `real-exam-ai` no topo

### 4. Anti-repeticao cross-session
- Em ExamSimulator e Simulados, buscar os `question_id` das ultimas 200 `practice_attempts` do usuario
- Excluir essas questoes da selecao
- Se nao houver questoes suficientes apos exclusao, permitir repeticoes das mais antigas

## Arquivos
- Editar: `src/pages/ExamSimulator.tsx` (query + ordenacao por fonte + anti-repeticao)
- Editar: `src/pages/Simulados.tsx` (buscar banco antes de gerar IA + anti-repeticao)
- Editar: `src/pages/QuestionsBank.tsx` (ordenacao por fonte)

