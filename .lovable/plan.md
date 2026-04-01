

# Rebalancear Dificuldade das Questões Geradas

## Problema

O prompt do gerador automático (`bulk-generate-content/index.ts`, linha 245) instrui a IA: **"40% fácil, 40% médio, 20% difícil"** — gerando pouquíssimas questões difíceis. Além disso, o fallback de dificuldade (linha 373) é `q.difficulty || 3` (médio), então questões sem dificuldade explícita ficam no nível médio.

## Correção

### 1. `supabase/functions/bulk-generate-content/index.ts` — Alterar distribuição no prompt

Substituir a linha 245:
- **De**: `"Varie a dificuldade: 40% fácil, 40% médio, 20% difícil"`
- **Para**: `"Varie a dificuldade: 20% fácil (difficulty:2), 40% médio (difficulty:3), 40% difícil (difficulty:4-5)"`

Isso equaliza a geração para produzir mais questões difíceis, compatível com provas de residência.

### 2. Reforçar no prompt de retry (linha 325)

Adicionar `"difficulty":4` no template do retry para que questões do fallback venham difíceis (compensando o déficit atual).

### 3. Validar campo difficulty no filtro de inserção

Na linha 373, ajustar o fallback: se a IA não fornecer `difficulty`, sortear entre 3-4 em vez de sempre defaultar para 3.

## Arquivo alterado

- `supabase/functions/bulk-generate-content/index.ts`

## Resultado

- Distribuição futura: ~20% fácil, ~40% médio, ~40% difícil
- Questões sem difficulty declarada recebem nível 3-4 (aleatório)
- Recuperação gradual do déficit de difíceis conforme novas gerações rodam

