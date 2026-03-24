

# Plano: Questões Diagnósticas Todas Iguais — Correção

## Problema Raiz

Os logs mostram que a IA está dando **timeout em TODAS as 8 áreas** (`AI_SERVICE_UNAVAILABLE`). Quando isso acontece, o sistema cai no `generateFallbackQuestionsForArea` que gera a **mesma questão genérica** para todas as áreas — "Paciente de 45 anos com dor torácica no PS". Resultado: 40 questões praticamente idênticas.

## Solução (2 frentes)

### 1. Fallback diversificado por área

Reescrever `generateFallbackQuestionsForArea` com um **banco de questões hardcoded distintas por área** (5 questões únicas para cada uma das 8 áreas = 40 questões diferentes). Cada questão terá caso clínico próprio, cenário, paciente e gabarito diferentes.

### 2. Melhorar resiliência da geração IA

- Aumentar `REQUEST_TIMEOUT_MS` de 22s para **35s** (a IA precisa gerar 5 questões complexas)
- Aumentar `timeoutMs` no body de 18s para **30s**
- Fazer chamadas **sequenciais em lotes de 2** ao invés de 8 paralelas (reduz sobrecarga)
- Se a IA falhar para uma área, usar o fallback diversificado

## Arquivo

**`src/pages/Diagnostic.tsx`**

- Substituir `generateFallbackQuestionsForArea` por banco com 40 questões únicas (5 por área)
- Ajustar timeouts
- Fazer chamadas em batches de 2 áreas paralelas

