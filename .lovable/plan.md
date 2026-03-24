

# Plano: Corrigir Geração de Questões no Simulados

## Problema Raiz

Existe um **conflito de formato** entre o que o cliente pede e o que o sistema prompt da Edge Function instrui:

| Componente | Formato esperado | Formato instruído |
|---|---|---|
| `Simulados.tsx` (cliente) | JSON array: `[{"statement":"...", "correct_index": 0, ...}]` | -- |
| `question-generator` system prompt | Markdown: `**Tópico:** ... **Questão:** ... **Gabarito:** a` | -- |

O cliente envia no body da mensagem: *"Formato OBRIGATÓRIO: JSON array puro"*, mas o system prompt da Edge Function tem **222 linhas** instruindo a IA a responder em **formato markdown** com `**Tópico:**`, `**Questão:**`, `a)`, `b)`, etc.

O system prompt **sobrepõe** a instrução do usuário. A IA gera em markdown, o cliente tenta fazer `match(/\[[\s\S]*\]/)` para extrair JSON, não encontra nada, e retorna 0 questões.

Agravantes:
- Logs mostram `[LovableAI] Attempt 1/3 failed: TIMEOUT` -- o prompt é enorme (222 linhas de system prompt + a mensagem do user), o que aumenta latência
- Quando faz streaming, o parser SSE tenta extrair JSON de chunks markdown, falhando silenciosamente

## Solução

### 1. Adicionar modo JSON explícito na Edge Function

Quando o cliente enviar `stream: false` (como o Simulados faz), adicionar uma instrução de **override de formato** no system prompt que force saída em JSON array puro. Isso será um parâmetro `outputFormat: "json"` no body.

**Arquivo:** `supabase/functions/question-generator/index.ts`
- Aceitar novo campo `outputFormat` do body
- Quando `outputFormat === "json"`, **substituir** a seção de formato do system prompt por instruções de JSON puro
- Adicionar `response_format: { type: "json_object" }` no body enviado à IA (quando disponível)

### 2. Simplificar o prompt para modo Simulados

Quando `outputFormat === "json"`, usar um system prompt **compacto** (~50 linhas vs 222) focado em:
- Gerar JSON array puro
- Manter qualidade clínica (casos clínicos, alternativas plausíveis)
- Remover instruções de formatação visual markdown (desnecessárias para JSON)

Isso reduz latência e risco de timeout.

### 3. Melhorar parsing no cliente

**Arquivo:** `src/pages/Simulados.tsx`
- Enviar `outputFormat: "json"` no body
- Adicionar fallback de parsing: se JSON array falhar, tentar parsear formato markdown via `parseQuestionsFromText`
- Adicionar retry automático (1x) se 0 questões forem parseadas
- Gerar em lotes de 10 quando count > 10 (ex: 30 questões = 3 chamadas paralelas de 10)

### 4. Timeout adequado

- Enviar `timeoutMs: 55000` para blocos de 10 questões (vs default 45s)
- O prompt compacto deve reduzir significativamente os timeouts

## Resumo das mudanças

| Arquivo | Mudança |
|---|---|
| `supabase/functions/question-generator/index.ts` | Aceitar `outputFormat`, prompt compacto JSON, `response_format` |
| `src/pages/Simulados.tsx` | Enviar `outputFormat: "json"`, gerar em lotes, retry, fallback parsing |

