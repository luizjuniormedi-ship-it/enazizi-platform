

# Corrigir 3 Problemas: Resposta no Enunciado, Volume 90/100, Mensagens do Professor

## Problemas Identificados

1. **Resposta aparece no enunciado** — A edge function `professor-simulado` não aplica sanitização nos enunciados retornados pela IA. O `sanitizeStatement` existe apenas no frontend `Simulados.tsx` (lado do aluno), mas não é aplicado no fluxo do professor.

2. **Apenas ~90 questões em vez de 100** — Com 4 batches de 25, o dedup contra `previousStatements` remove questões similares, e não há loop de complemento para preencher o déficit. O frontend aceita o que vier sem tentar completar.

3. **Mensagens de tarefa do professor parecem mensagens normais** — O `AdminMessagesBanner` não diferencia visualmente mensagens de tarefas do professor (simulados, casos clínicos) das mensagens normais do sistema. Todas aparecem iguais.

## Correções

### 1. Sanitizar enunciados no backend (`professor-simulado/index.ts`)

Adicionar `sanitizeStatement()` no backend, após parsing do JSON da IA (linha ~319, antes do retorno):

```typescript
function sanitizeStatement(raw: string): string {
  let s = raw;
  // Remove gabarito/resposta correta que a IA às vezes coloca no final
  s = s.replace(/\n?\s*\*{0,2}(Gabarito|Resposta|Alternativa correta|Correct answer|Answer)[:\s].*/gi, "");
  // Remove metadata de tema/tópico no final
  s = s.replace(/\n?\s*\*{0,2}(Tópico|Tema|Especialidade|Subtema|Dificuldade|Difficulty)[:\s].*/gi, "");
  // Remove "Questão X:" prefix
  s = s.replace(/^\s*\*{0,2}Questão\s*\d*\s*:?\s*\*{0,2}\s*/gi, "");
  // Truncate after last "?" if trailing lines are short non-clinical metadata
  const lastQ = s.lastIndexOf("?");
  if (lastQ > 0 && lastQ < s.length - 2) {
    const after = s.slice(lastQ + 1).trim();
    const lines = after.split("\n").filter(l => l.trim());
    if (lines.length > 0 && lines.length <= 5 &&
        lines.every(l => l.trim().length < 100 && !/\d+\s*(mg|ml|mmHg|bpm|°C|%|U\/L|g\/dL|mEq|mmol)/.test(l))) {
      s = s.slice(0, lastQ + 1);
    }
  }
  return s.trim();
}
```

Aplicar a cada questão antes de retornar:
```typescript
questions = questions.map(q => ({ ...q, statement: sanitizeStatement(q.statement || "") }));
```

### 2. Loop de complemento no frontend (`ProfessorDashboard.tsx`)

Após o loop de batches (~linha 322), adicionar até 2 tentativas de preenchimento de déficit:

```typescript
// Complement loop: if we have fewer than requested, try to fill
const target = parseInt(questionCount);
for (let fill = 0; fill < 2 && allQuestions.length < target; fill++) {
  const deficit = target - allQuestions.length;
  toast({ title: `Completando déficit...`, description: `Faltam ${deficit} questões` });
  const prevStmts = allQuestions.map(q => String(q.statement || "").slice(0, 120));
  try {
    const res = await callAPI({
      action: "generate_questions",
      topics: topicsWithSubs,
      count: Math.min(deficit, 25),
      difficulty,
      previousStatements: prevStmts,
    });
    allQuestions = [...allQuestions, ...(res.questions || [])];
    setGeneratedQuestions([...allQuestions]);
  } catch { break; }
}
```

### 3. Diferenciar mensagens de tarefa do professor (`AdminMessagesBanner.tsx`)

Detectar mensagens de professor por padrão no título (contêm "Prof." ou "Simulado" ou "Caso Clínico" ou "Tema de Estudo") e exibir com ícone e estilo diferente:

- Ícone `GraduationCap` em vez de `Mail` para mensagens de professor
- Badge "Atividade" em azul ao invés de "Normal"/"Importante"
- Seção separada no topo: "📋 Atividades Pendentes do Professor" antes das mensagens gerais

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/professor-simulado/index.ts` | Adicionar `sanitizeStatement()` e aplicar a todas questões geradas |
| `src/pages/ProfessorDashboard.tsx` | Loop de complemento (até 2 tentativas) quando `allQuestions.length < target` |
| `src/components/dashboard/AdminMessagesBanner.tsx` | Separar visualmente mensagens de tarefa do professor das mensagens normais |

