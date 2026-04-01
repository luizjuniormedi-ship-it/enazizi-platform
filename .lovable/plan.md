
# Fix: Duplicatas nos Cards do Pipeline + Atualização em Tempo Real

## Problemas Identificados

1. **229 questões duplicadas** no banco (7.619 total, ~7.390 únicas)
2. **454 questões com topic "ENARE"** + ~150 questões com subtópicos fragmentados (ex: "Bactérias Gram-negativas", "Infecção Urinária", "Hipertireoidismo") que não são contabilizadas nos cards de especialidade
3. **Cards do pipeline não atualizam** durante/após equalização — `stats` só é carregado em `loadLogs`/`loadSources` no mount, nunca após gerar questões
4. **Card "Duplicatas" mostra valor errado** — vem de `ingestion_log.duplicates_skipped` (logs de importação), não reflete duplicatas reais no banco

## Correções

### 1. Migração — Limpar 229 duplicatas reais + normalizar 600+ questões fragmentadas

```sql
-- Remover duplicatas (manter a mais antiga com explicação)
-- Normalizar "ENARE" → especialidade correta via subtopic
-- Consolidar subtópicos fragmentados para seus tópicos pai
```

### 2. `AdminIngestionPanel.tsx` — Cards com dados reais do banco

Substituir os 4 cards estáticos por dados dinâmicos:
- **Total Questões**: contagem real do `questions_bank` (vem do `loadDistribution`)
- **Únicas**: questões com statement único
- **Duplicatas**: diferença entre total e únicas (calculado real)
- **Especialidades**: número de especialidades com questões

Atualizar os cards dentro de `loadDistribution()` já que ele faz o fetch paginado completo.

### 3. Refresh automático após cada batch de equalização

Já chama `loadDistribution()` após cada batch. Precisa também chamar `loadLogs()` e `loadSources()` para atualizar os cards de log. Ou melhor: calcular stats dos cards diretamente dentro de `loadDistribution` para ter tudo sincronizado.

### 4. `bulk-generate-content` — Deduplicação antes de inserir

Verificar se a edge function já faz dedup por hash. Se não, adicionar check dos primeiros 80 chars antes de insert para evitar novas duplicatas.

## Arquivos alterados

- `src/components/admin/AdminIngestionPanel.tsx` — Cards com dados reais + refresh automático
- Migração SQL — Limpar duplicatas + normalizar tópicos fragmentados

## Resultado

- Cards mostram dados reais e atualizados do banco
- Atualizam automaticamente durante e após equalização
- ~229 duplicatas removidas
- ~600 questões com tópicos fragmentados normalizadas para especialidades corretas
