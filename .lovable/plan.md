

# Plano: Geração 3x ao Dia (2 Especialidades por Vez)

## Estratégia
- Reduzir de 4 para **2 especialidades por execução** (resolve o timeout de ~150s)
- Agendar **3 execuções diárias**: 6h, 14h, 22h
- Total: **6 especialidades/dia** com 20 questões cada = ~120 questões/dia
- Forçar `topic: specialty` (nome principal) no insert para evitar fragmentação

## Mudanças

### 1. `supabase/functions/daily-question-generator/index.ts`
- Mudar `sorted.slice(0, 4)` → `sorted.slice(0, 2)` (2 especialidades por run)
- Override `topic` no insert: usar sempre a especialidade principal em vez do que a IA retorna
- Otimizar query de contagem: usar `ilike` para agrupar subtópicos na mesma especialidade

### 2. Cron Jobs (3x/dia via pg_cron)
- Agendar 3 chamadas: `0 6 * * *`, `0 14 * * *`, `0 22 * * *`
- Cada uma invoca a mesma Edge Function que processa as 2 especialidades com menor volume

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/daily-question-generator/index.ts` | Reduzir para 2 especialidades, forçar topic principal |
| Cron SQL (insert direto) | 3 jobs: 6h, 14h, 22h |

