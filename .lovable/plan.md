

# Plano: Corrigir Bugs Estruturais na Simulação Clínica

## Problemas Encontrados

### Bug 1: Edge Function (`clinical-simulation/index.ts`)
O bloco `action === "deteriorate"` (linha 320-381) está **sem fechamento `}`** e a chamada `aiFetch()` está **completamente ausente**. O código pula diretamente do prompt de deterioração para `if (!aiResp.ok)` na linha 384, onde `aiResp` nunca foi definida.

**Correção**: Fechar o bloco deteriorate com `}` e adicionar a chamada `aiFetch` entre os blocos de ação e o parsing da resposta. A chamada provavelmente foi perdida em edições anteriores.

### Bug 2: Frontend (`ClinicalSimulation.tsx`)
A declaração `const startSimulation = async () => {` foi perdida na linha 582. O corpo da função começa direto com `setLoading(true)` na linha 583, e há uma `}` extra no final (linha 1877).

**Correção**: Restaurar a declaração da função na linha 582.

## Mudanças

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/clinical-simulation/index.ts` | Fechar bloco deteriorate com `}`, adicionar `const aiResp = await aiFetch(...)` antes da linha 384 |
| `src/pages/ClinicalSimulation.tsx` | Restaurar `const startSimulation = async () => {` na linha 582 |

## Sobre a Deterioração Fisiopatológica
Sim, **todos os critérios clínicos realistas JÁ estão implementados** no prompt de deterioração (linhas 333-379):
- Proibições explícitas (verde/amarelo sem parada nos níveis 1-2)
- Mapa de severidade por triage (verde, amarelo, laranja/vermelho)
- Exemplos de coerência (pneumonia, sepse, fratura, etc.)
- Campo obrigatório `deterioration_rationale`
- Narrativa com justificativa clínica

O problema é que o código **nunca chega a executar** porque falta a chamada à IA. Após a correção, tudo funcionará corretamente.

