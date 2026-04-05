

# Plano: Corrigir IVAS reaparecendo após "Já concluí"

## Diagnóstico

**Causa raiz**: Dois componentes discordam sobre quais revisões são válidas.

1. **Study Engine** (`src/lib/studyEngine.ts` linha 250-256): busca `revisoes` com `status = 'pendente'` **sem filtro de data**. Depois, nas linhas 555-584, recomenda TODAS as revisões pendentes (incluindo futuras como IVAS em 2026-04-07).

2. **`markReviewDone`** (`src/lib/completeStudyAction.ts` linha 79): filtra `.lte("data_revisao", today)` — só encontra revisões de hoje ou passadas. Como a próxima revisão de IVAS é 2026-04-07 (futuro), o update afeta 0 linhas. Resultado: IVAS volta como pendente na próxima missão.

**Dados reais do banco para IVAS**:
- 2026-04-01: concluida
- 2026-04-03: concluida  
- 2026-04-07: **pendente** (futuro)
- 2026-04-15: pendente (futuro)
- 2026-04-30: pendente (futuro)

## Correção (2 arquivos)

### 1. `src/lib/studyEngine.ts` — Filtrar revisões futuras

Na query de revisões (linha 250-256), adicionar `.lte("data_revisao", today)` para não recomendar revisões que ainda não venceram.

Isso garante que o engine só recomende revisões que o usuário realmente precisa fazer hoje.

### 2. `src/lib/completeStudyAction.ts` — Fallback para revisão futura

Se o usuário conseguir clicar "Já concluí" em uma revisão sem correspondência hoje (edge case), remover o filtro `.lte("data_revisao", today)` e marcar a próxima revisão pendente independente da data. Isso serve como safety net.

## O que NÃO muda
- Estrutura de tabelas, rotas, RLS, Tutor IA, useMissionMode

