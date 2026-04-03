

# Camada de Controle de Contexto na Geração de Questões

## Visão Geral

Implementar validação obrigatória de contexto antes e depois da geração de questões, garantindo que toda questão esteja em pt-BR, dentro do tema correto, e alinhada ao objetivo pedagógico. Sem quebrar fluxos existentes.

## Arquitetura

```text
Caller (Simulados, Diagnostic, AutoReplenish, etc.)
  │
  ├─ [NOVO] buildGenerationContext() ← fallback chain
  │
  ▼
question-generator edge function
  │
  ├─ [NOVO] Validação de contexto no body (specialty, topic, language)
  ├─ [ATUALIZADO] Prompt com regras de escopo rígidas
  ├─ [EXISTENTE] aiFetch → IA gera questões
  │
  ▼
  ├─ [EXISTENTE] isValidQuestion + hasMinimumContext
  ├─ [ATUALIZADO] + validateQuestionContext() ← verifica specialty/topic match
  ├─ [ATUALIZADO] + ENGLISH_PATTERN reforçado
  │
  ▼
  ├─ [NOVO] Log de rejeições (console structured)
  │
  ▼
Questões filtradas retornadas ao caller
```

## Arquivos e Mudanças

### 1. `src/lib/questionGenerationContext.ts` (NOVO)

Criar tipo `QuestionGenerationContext` e função `buildGenerationContext()` com cadeia de fallback:

1. StudyContext ativo (URL params `sc_*`)
2. Último tema da sessão (`temas_estudados` mais recente)
3. Tema fraco do Study Engine
4. Fallback seguro: `{ specialty: "Clínica Médica", topic: "Clínica Médica Geral", language: "pt-BR" }`

Exportar também `validateContextBeforeGeneration()` que rejeita contexto sem specialty/topic.

### 2. `supabase/functions/_shared/question-filters.ts` (ATUALIZAR)

- Expandir `ENGLISH_PATTERN` com mais termos ("correct answer", "regarding", "concerning", etc.) — alguns já existem, consolidar
- Adicionar `validateQuestionContext(question, expectedContext)`:
  - Verifica se `topic` da questão contém a specialty/topic esperado
  - Rejeita se não bater
- Adicionar `logGenerationRejection(reason, expected, snippet)` para log estruturado

### 3. `supabase/functions/question-generator/index.ts` (ATUALIZAR)

- Aceitar campos opcionais no body: `generationContext: { specialty, topic, subtopic, objective, difficulty, studentLevel, language }`
- Quando `generationContext` presente:
  - Injetar no prompt: "ESCOPO OBRIGATÓRIO: Gere APENAS sobre {specialty} > {topic} > {subtopic}. NÃO amplie para outros temas."
  - Injetar objetivo pedagógico no prompt
  - Após geração (JSON mode): validar cada questão contra o contexto esperado, descartar as que não batem
- Prompt reforçado: adicionar bloco "PROIBIÇÕES ABSOLUTAS" sobre idioma e escopo

### 4. Callers — injetar contexto (ATUALIZAR)

**`src/pages/Simulados.tsx`** — Na `generateBatch()`, passar `generationContext` com specialty dos topics selecionados

**`src/pages/Diagnostic.tsx`** — Na invocação, passar `generationContext` com specialty da área atual

**`src/pages/ExamSimulator.tsx`** — Passar `generationContext` com areas do examConfig

**`src/hooks/useAutoReplenish.ts`** — Passar `generationContext` com o topic ativo

**`src/components/daily-plan/MicroQuizDialog.tsx`** — Passar `generationContext` com specialty e topic

### 5. Testes — `src/test/questionGenerationContext.test.ts` (NOVO)

- `buildGenerationContext` sem contexto → retorna fallback "Clínica Médica"
- `buildGenerationContext` com StudyContext → retorna specialty/topic corretos
- `validateQuestionContext` com questão em inglês → rejeita
- `validateQuestionContext` com topic errado → rejeita
- `validateQuestionContext` com questão válida → aceita

## O Que NÃO Muda

- Rotas existentes
- Estrutura de resposta da edge function
- Fluxo de streaming (modo texto)
- Funcionalidades existentes (cache, anti-repetição, filtros de qualidade)
- Tabelas do banco de dados

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/lib/questionGenerationContext.ts` | Criar (tipo + fallback + validação) |
| `supabase/functions/_shared/question-filters.ts` | Expandir filtros + context validation |
| `supabase/functions/question-generator/index.ts` | Aceitar/injetar contexto + validação pós-geração |
| `src/pages/Simulados.tsx` | Passar generationContext |
| `src/pages/Diagnostic.tsx` | Passar generationContext |
| `src/pages/ExamSimulator.tsx` | Passar generationContext |
| `src/hooks/useAutoReplenish.ts` | Passar generationContext |
| `src/components/daily-plan/MicroQuizDialog.tsx` | Passar generationContext |
| `src/test/questionGenerationContext.test.ts` | Criar testes |

