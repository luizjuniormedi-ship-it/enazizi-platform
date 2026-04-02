

# Cache de Questões Antes de Chamar a IA

## Resumo
Antes de gastar créditos de IA gerando questões, consultar o `questions_bank` e `real_exam_questions` para reutilizar questões existentes que já correspondem à especialidade/subtópico/dificuldade solicitados. Só gerar via IA as questões faltantes.

## Lógica

```text
Pedido: 25 questões de Cardiologia (intermediário)
  │
  ├─ 1. Buscar no banco: questions_bank + real_exam_questions
  │     filtro: topic ILIKE '%Cardiologia%', is_global=true, review_status='approved'
  │     excluir: previousStatements (dedup)
  │     limite: 25
  │
  ├─ 2. Se encontrou 25 → retorna direto (0 chamadas IA)
  │     Se encontrou 15 → gera apenas 10 via IA
  │     Se encontrou 0  → gera 25 via IA (comportamento atual)
  │
  └─ 3. Mescla banco + IA, marca source: "cache" | "ai" | "mixed"
```

## Alterações

### 1. `supabase/functions/professor-simulado/index.ts` — case `generate_questions`

**Antes da chamada IA (linha ~177), inserir busca ao banco:**

```typescript
// --- CACHE: buscar questões existentes no banco ---
const cacheQuestions: any[] = [];
const cacheLimit = batchCount;

// Buscar de questions_bank (approved + global)
const topicFilters = topics.map((t: string) => `topic.ilike.%${t}%`).join(",");
const { data: cachedBank } = await sb
  .from("questions_bank")
  .select("statement, options, correct_index, explanation, topic")
  .or(topicFilters)
  .eq("is_global", true)
  .eq("review_status", "approved")
  .limit(cacheLimit);

// Buscar também de real_exam_questions
const { data: cachedReal } = await sb
  .from("real_exam_questions")
  .select("statement, options, correct_index, explanation, topic")
  .or(topicFilters)
  .eq("is_active", true)
  .limit(cacheLimit);

// Combinar, dedup contra previousStatements, embaralhar
let allCached = [...(cachedBank || []), ...(cachedReal || [])];

// Dedup contra previousStatements
if (Array.isArray(previousStatements) && previousStatements.length > 0) {
  const prevKeys = new Set(previousStatements.map(s => String(s).slice(0,100).toLowerCase().replace(/\s+/g," ")));
  allCached = allCached.filter(q => {
    const key = String(q.statement||"").slice(0,100).toLowerCase().replace(/\s+/g," ");
    return !prevKeys.has(key);
  });
}

// Embaralhar e pegar até batchCount
allCached.sort(() => Math.random() - 0.5);
const fromCache = allCached.slice(0, batchCount).map(q => ({
  statement: q.statement,
  options: Array.isArray(q.options) ? q.options : [],
  correct_index: q.correct_index ?? 0,
  explanation: q.explanation || "",
  topic: q.topic || topics[0],
  block: q.topic || topics[0],
  difficulty_level: difficulty || "intermediario",
}));

const remaining = batchCount - fromCache.length;
```

**Depois: só chamar IA se `remaining > 0`**, ajustando o prompt para gerar apenas `remaining` questões. Se `remaining === 0`, pular IA inteiramente.

**Ajustar o retorno** para indicar `source: "cache"` quando 100% do banco, `"mixed"` quando parcial, `"ai"` quando 100% IA.

### 2. `supabase/functions/question-generator/index.ts` — modo JSON

Adicionar cache similar **apenas no modo JSON** (usado pelos simulados do aluno):
- Antes de chamar `aiFetch`, buscar questões do banco que correspondam à especialidade mencionada na mensagem
- Se encontrar suficientes, retornar direto no formato tool_call sem gastar créditos
- Se parcial, gerar apenas o faltante

### 3. Frontend `src/pages/QuestionGenerator.tsx`

Nenhuma mudança necessária — o frontend já trata o campo `source` retornado. Apenas exibirá toast informativo "X questões do banco + Y geradas por IA" quando `source === "mixed"` ou `"cache"`.

### 4. Frontend `src/pages/ProfessorDashboard.tsx`

Adicionar tratamento do `source === "cache"` no toast:
- `"cache"`: "Questões obtidas do banco existente (sem custo de IA)"
- `"mixed"`: "X questões do banco + Y geradas por IA"

## Economia Estimada
- Com ~5000 questões aprovadas no banco, a maioria dos pedidos de 25 questões de especialidades comuns será atendida 100% pelo cache
- Economia de 60-80% nos créditos de IA para geração de questões do professor

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/professor-simulado/index.ts` | Cache de questões do banco antes de chamar IA; gerar apenas faltantes |
| `supabase/functions/question-generator/index.ts` | Cache no modo JSON para simulados do aluno |
| `src/pages/ProfessorDashboard.tsx` | Toast informativo sobre origem das questões (cache/mixed/ai) |

