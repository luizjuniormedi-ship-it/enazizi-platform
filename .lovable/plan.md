

# Fix: "undefined questões extraídas" no Pipeline

## Causa Raiz

Dois problemas simultâneos:

1. **`WORKER_LIMIT`**: A edge function `ingest-questions` está estourando os recursos de compute (provavelmente ao baixar/processar PDFs grandes). Quando crasha, retorna status 546 sem JSON válido, e o frontend lê `data.questions_inserted` como `undefined`.

2. **Falta de tratamento de erro no frontend**: O `callIngest` faz `resp.json()` sem verificar `resp.ok`, e o toast interpola `undefined` direto na string.

## Correções

### 1. Frontend — `AdminIngestionPanel.tsx`

- No `callIngest`, verificar `resp.ok` antes de parsear JSON. Se status >= 400, lançar erro com mensagem descritiva.
- Nos toasts e setState, usar `data.questions_inserted ?? 0` em vez de `data.questions_inserted` direto.
- Nos logs da aba Log, usar `log.questions_inserted ?? 0`, `log.questions_updated ?? 0`, `log.duplicates_skipped ?? 0`.

### 2. Frontend — `AdminWebScrapingPanel.tsx`

- Mesma proteção: `data?.questions_inserted ?? 0` nos toasts e result display.

### 3. Edge Function `ingest-questions` — Reduzir consumo de recursos

- Adicionar timeout mais curto para fetch de PDFs (30s em vez de ilimitado)
- Limitar o tamanho do texto extraído do PDF (primeiros 200KB)
- Adicionar `try/catch` robusto no fetch do PDF para retornar resultado parcial em vez de crashar
- No response final, garantir `questions_inserted: inserted ?? 0`

### Arquivos Impactados

| Arquivo | Mudança |
|---|---|
| `src/components/admin/AdminIngestionPanel.tsx` | Null-safe access em `questions_inserted`, error handling no `callIngest` |
| `src/components/admin/AdminWebScrapingPanel.tsx` | Null-safe access em `questions_inserted` |
| `supabase/functions/ingest-questions/index.ts` | Timeout no fetch, limite de tamanho, fallback gracioso |

