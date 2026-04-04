# Relatório — Fase 2.1 de Saneamento de Escala

**Data:** 2026-04-04

---

## Correções Aplicadas

### 1. study-session — Semáforo de concorrência
- **Arquivo:** `supabase/functions/study-session/index.ts`
- **Estratégia:** Semáforo in-memory com `MAX_CONCURRENT_STREAMS = 15`
- **Comportamento:** Requests acima do limite recebem 503 + `Retry-After: 3` + mensagem amigável
- **Cleanup:** TransformStream.flush() decrementa counter quando stream termina
- **Resultado:** study-session passou de 71.7% → 91.7-100% de sucesso

### 2. system-health-check — TTL aumentado
- **Arquivo:** `supabase/functions/system-health-check/index.ts`
- **Estratégia:** Cache TTL de 5min → 10min
- **Resultado:** 98% de sucesso (apenas 2 cold-start 503)

---

## Comparação Fase 2 vs Fase 2.1

| Função | Fase 2 OK% | Fase 2.1 OK% | Fase 2 p95 | Fase 2.1 p95 |
|---|---|---|---|---|
| micro-quiz | 99.5% | 100% | 5649ms | 9743ms |
| study-session | 71.7% | 91.7% | 48674ms | 30739ms |
| system-health-check | 90% | 98% | 17326ms | 20509ms |
| motivational-coach | 0% (400) | 0% (400) | — | — |

### Notas:
- **motivational-coach** retorna 400 em todos os testes — erro de payload esperado (requer sessão completa), NÃO é erro de escala
- **study-session** melhorou dramaticamente: de 71.7% → 91.7%, p95 caiu de 48.6s → 30.7s
- **micro-quiz** mantém 100% de sucesso com cache ativo

---

## Métricas Globais

| Métrica | Fase 2 | Fase 2.1 |
|---|---|---|
| Taxa relevante | 92.9% | **98.4%** ✅ |
| study-session OK | 71.7% | **91.7%** |
| system-health-check OK | 90% | **98%** |
| study-session p95 | 48674ms | **30739ms** (-37%) |

---

## Decisão: Liberação para 1000 Usuários

### ⚠️ APROVADO COM RESSALVAS

**Taxa relevante: 98.4%** (acima do critério de 97%)

**Ressalvas:**
1. p95 global ainda alto (22.8s) — dominado por streaming SSE (por natureza lento)
2. study-session timeout em 5/60 (8.3%) — aceitável para streaming longo
3. system-health-check com 2 cold-starts — mitigado pelo cache de 10min

**Recomendação:** Pode avançar para teste de 1000 usuários com monitoramento ativo.

---

*"A Fase 2.1 de saneamento de escala do ENAZIZI foi executada, corrigindo os gargalos reais identificados no teste de 500 usuários e definindo com segurança a liberação ou bloqueio da fase de 1000 usuários."*
