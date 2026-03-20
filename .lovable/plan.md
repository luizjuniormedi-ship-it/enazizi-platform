

# Fix: Taxa de Acerto — Converter Percentuais para Contagens

## Problema
`exam_sessions.score` e `teacher_simulado_results.score` armazenam **percentuais** (ex: 50, 71.4, 80), mas o código soma esses valores como se fossem **contagens de acertos**, inflando a taxa para 400%+.

## Solução
Converter os percentuais de volta para contagens absolutas antes de somar:

**Arquivo: `src/hooks/useDashboardData.ts`** (linhas 87 e 91)

```typescript
// score é percentual → converter para contagem
const examCorrectTotal = examData.reduce((sum, e) => {
  const total = e.total_questions || 0;
  return sum + Math.round(((e.score || 0) / 100) * total);
}, 0);

const teacherCorrectTotal = teacherSimData.reduce((sum, e) => {
  const total = e.total_questions || 0;
  return sum + Math.round(((e.score || 0) / 100) * total);
}, 0);
```

Adicionar safety cap na linha 96:
```typescript
const accuracy = questionsAnswered > 0
  ? Math.min(Math.round((totalCorrect / questionsAnswered) * 100), 100)
  : 0;
```

Isso corrige o cálculo combinado mantendo todas as fontes (practice, simulados, professor) unificadas numa única taxa de acerto precisa.

