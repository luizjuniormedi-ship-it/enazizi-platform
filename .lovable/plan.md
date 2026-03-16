

## Plano: Corrigir timeout nos uploads — reduzir chunks e processar em paralelo

### Problema
As funções `process-upload` e `populate-questions` processam muitos chunks sequencialmente (até 10 e 5 respectivamente), cada um fazendo uma chamada à IA. Isso excede o limite de tempo da conexão HTTP (erro `connection closed before message completed`).

### Solução
Reduzir o número de chunks e processá-los em paralelo com `Promise.allSettled` para terminar dentro do tempo limite.

### Mudanças

**1. `supabase/functions/populate-questions/index.ts`**
- Reduzir de 10 chunks para 4
- Aumentar `chunkSize` de 10000 para 15000 (menos chunks, mais conteúdo cada)
- Processar os 4 chunks em paralelo com `Promise.allSettled`

**2. `supabase/functions/process-upload/index.ts`**
- Reduzir chunks de questões de 5 para 3
- Aumentar `chunkSize` de 8000 para 12000
- Processar chunks em paralelo com `Promise.allSettled`
- Reduzir flashcard text de 15000 para 10000 chars (mais rápido)

### Resultado esperado
- Tempo de processamento reduzido de ~50-60s para ~15-20s (paralelo)
- Ainda gera quantidade significativa de questões (3-4 chunks × 10-20 questões = 30-80 questões)

### Arquivos alterados
- `supabase/functions/populate-questions/index.ts`
- `supabase/functions/process-upload/index.ts`

