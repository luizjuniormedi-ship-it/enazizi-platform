

# Plano: Reforçar Regras Anti-Repetição em Todos os Módulos de Geração

## Problema
O gerador de flashcards recebeu regras anti-repetição reforçadas, mas os outros módulos de geração de conteúdo ainda usam regras mais fracas, permitindo repetição de conceitos, pacientes e cenários clínicos.

## Módulos Afetados

### 1. `question-generator/index.ts`
Tem regras anti-repetição básicas mas falta a **verificação pré-envio obrigatória** e a **estratégia de diversificação** (listar 10+ subtópicos antes de gerar).

### 2. `study-session/index.ts`
A fase "questions" tem regra de anamnese única mas as outras fases (lesson, active-recall, discursive) não têm proteção contra repetição de conceitos e exemplos.

### 3. `enamed-generator/index.ts`
Tem anamnese única mas falta verificação pré-envio e regra explícita contra repetição de conceitos clínicos idênticos entre questões/flashcards/casos.

### 4. `bulk-generate-content/index.ts`
Mesmo problema do enamed-generator.

## Mudanças

Para cada módulo, adicionar o bloco de **PRIORIDADE MÁXIMA** já validado no generate-flashcards:

- **Proibição de repetição de conceito clínico**: nunca abordar o mesmo conceito/doença com mesmo enfoque duas vezes
- **Verificação pré-envio obrigatória**: 4 checagens antes de finalizar (perguntas similares, conceitos duplicados, perfis repetidos, diversificação)
- **Estratégia de diversificação**: listar 10+ subtópicos mentalmente antes de gerar, distribuir entre diagnóstico/tratamento/fisiopatologia/epidemiologia

### Arquivos a editar
- `supabase/functions/question-generator/index.ts` — adicionar bloco anti-repetição reforçado
- `supabase/functions/study-session/index.ts` — adicionar regras nas fases lesson, active-recall e discursive
- `supabase/functions/enamed-generator/index.ts` — adicionar verificação pré-envio no prompt
- `supabase/functions/bulk-generate-content/index.ts` — adicionar verificação pré-envio no prompt

