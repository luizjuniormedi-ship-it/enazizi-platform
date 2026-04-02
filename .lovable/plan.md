

# Corrigir Simulado: Limite de 90 Questões e Resposta no Enunciado

## Problema 1: Só aparecem 90 de 104 questões
O `BATCH_SIZE = 10` gera muitos lotes pequenos. Filtros rigorosos (mínimo 200 chars, regex anti-inglês, regex anti-imagem) rejeitam muitas questões. O complemento final só tenta **1 vez** com no máximo 10 questões. Para simulados grandes (100+), faltam questões.

## Problema 2: Resposta aparece no enunciado
A IA às vezes inclui o tema e subtema no final do campo `statement`:
```
"...confirmação diagnóstica inicial?\n\nAngiologia\n\nDoença Arterial Obstrutiva Periférica (DAOP) - Diagnóstico"
```
O `mapQuestions` não limpa isso, e o aluno vê a resposta antes de responder.

## Solução

### `src/pages/Simulados.tsx`

1. **Aumentar BATCH_SIZE**: de 10 para 20 (menos lotes, menos perdas entre lotes)

2. **Limpar statement no `mapQuestions`**: após extrair o statement, cortar tudo depois do último `?` que aparece antes de quebras de linha com texto curto (padrão de "tema + subtema" solto no final). Regex:
```typescript
// Remove trailing topic/answer lines after the question mark
statement = statement.replace(/\?\s*\n\n[\s\S]{0,200}$/, (match) => {
  // Only strip if what follows looks like metadata (short lines, no clinical data)
  const afterQuestion = match.slice(1).trim();
  const lines = afterQuestion.split('\n').filter(l => l.trim());
  if (lines.every(l => l.trim().length < 80 && !/\d+\s*(mg|ml|mmHg|bpm|°C|%)/.test(l))) {
    return '?';
  }
  return match;
});
```

3. **Loop de complemento mais agressivo**: se após todos os lotes ainda faltam questões, fazer até **3 tentativas** de complemento (não apenas 1), cada uma pedindo o déficit restante

4. **Relaxar filtro de comprimento mínimo para banco**: questões do banco (`bankQuestions`) já são aprovadas — o filtro `statement.length >= 200` só deve se aplicar a questões geradas por IA, não às do banco. Atualmente o banco filtra com `> 10` (ok), mas o `mapQuestions` da IA usa `>= 200` (correto, manter)

### `supabase/functions/question-generator/index.ts`

5. **Reforçar no prompt**: adicionar instrução explícita:
```
PROIBIDO: NÃO inclua o tema, especialidade, subtema ou gabarito dentro do campo "statement". O statement deve conter APENAS o caso clínico e a pergunta. O tema vai no campo "topic" separadamente.
```

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Simulados.tsx` | BATCH_SIZE=20, sanitizar statement no mapQuestions, loop de complemento com 3 tentativas |
| `supabase/functions/question-generator/index.ts` | Reforçar prompt para não incluir metadata no statement |

