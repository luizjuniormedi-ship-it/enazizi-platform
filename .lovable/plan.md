

# Plano: Calibrar Questões IA ao Nível REVALIDA/ENAMED

## Problema Atual
- O `daily-question-generator` pede "40% fácil, 40% médio, 20% difícil" — muito abaixo do nível REVALIDA
- Falta validação pós-geração para rejeitar questões simples demais
- Os prompts mencionam ENARE/REVALIDA mas não definem critérios objetivos de calibração

## Mudanças

### 1. `supabase/functions/daily-question-generator/index.ts`
- Alterar distribuição: **0% fácil, 50% intermediário (padrão REVALIDA), 50% difícil (padrão ENAMED/ENARE)**
- Adicionar bloco de calibração no prompt com critérios objetivos do REVALIDA:
  - Obrigatório caso clínico com ≥3 dados clínicos relevantes
  - Mínimo 2 etapas de raciocínio (ex: diagnóstico → conduta)
  - Distratores baseados em diagnósticos diferenciais reais
  - Proibido questões diretas de "definição" ou "conceito puro"
- Adicionar validação pós-geração: rejeitar questões com enunciado < 150 caracteres (indica questão simples demais)

### 2. `supabase/functions/enamed-generator/index.ts`
- Reforçar calibração: eliminar nível "fácil", mínimo dificuldade 3
- Adicionar critérios de validação: rejeitar questões sem caso clínico (enunciado < 200 chars)

### 3. `supabase/functions/question-generator/index.ts`
- Ajustar nível padrão (quando sem difficulty): de "intermediário" para "padrão REVALIDA/ENAMED"
- Atualizar `diffMap` para que "intermediario" = nível REVALIDA real e "dificil" = nível ENAMED com pegadinhas
- Adicionar bloco de calibração com exemplos de padrão esperado

### 4. `src/pages/Diagnostic.tsx`
- Ajustar prompt de geração para exigir nível REVALIDA explicitamente
- Remover nível "básico" da adaptação dinâmica

## Critérios de Calibração REVALIDA/ENAMED (adicionados aos prompts)

```text
CALIBRAÇÃO OBRIGATÓRIA REVALIDA/ENAMED:
- PROIBIDO: questões de definição pura ("O que é X?")
- PROIBIDO: enunciados < 150 caracteres sem caso clínico
- OBRIGATÓRIO: caso clínico com ≥3 dados clínicos (vitais, exames, achados)
- OBRIGATÓRIO: ≥2 etapas de raciocínio clínico
- OBRIGATÓRIO: pelo menos 2 distratores plausíveis (diagnóstico diferencial real)
- DIFICULDADE MÍNIMA: 3/5 (intermediário = padrão REVALIDA)
```

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/daily-question-generator/index.ts` | Calibração REVALIDA + validação |
| `supabase/functions/enamed-generator/index.ts` | Reforçar nível mínimo + validação |
| `supabase/functions/question-generator/index.ts` | Ajustar diffMap e nível padrão |
| `src/pages/Diagnostic.tsx` | Nível mínimo REVALIDA |

