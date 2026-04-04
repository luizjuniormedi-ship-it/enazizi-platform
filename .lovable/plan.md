

# Corrigir Micro-Quiz Lento no Plano do Dia

## Problema
O `MicroQuizDialog` chama a edge function `question-generator`, que e projetada para gerar questoes complexas de Residencia Medica (400+ caracteres, 5 alternativas, casos clinicos completos, bibliografias). Para um micro-quiz de validacao rapida com 2 perguntas simples, isso causa:

1. **Prompt massivo** — o system prompt tem ~3000+ tokens so de instrucoes
2. **Geracao pesada** — pede caso clinico completo com sinais vitais, exames, 5 alternativas
3. **Timeout frequente** — a edge function pode levar 15-30s+ para gerar, frequentemente falhando
4. **Formato incompativel** — o micro-quiz espera `question`/`options`/`correctIndex` mas o generator retorna `statement`/`options`/`correct_index`

## Solucao

Substituir a chamada ao `question-generator` por uma chamada direta ao Lovable AI (via `ai-fetch`) em uma edge function dedicada e leve, ou gerar as questoes client-side usando o Lovable AI diretamente.

**Abordagem escolhida**: Criar uma edge function `micro-quiz` dedicada, com prompt minimo e rapido.

### 1. Nova Edge Function `supabase/functions/micro-quiz/index.ts`
- Prompt curto e direto: "Gere 2 questoes objetivas simples sobre {tema} ({especialidade}), 4 alternativas cada, em pt-BR"
- Usar modelo rapido (flash) via `ai-fetch`
- Resposta JSON compacta
- Timeout de 15s max

### 2. Atualizar `MicroQuizDialog.tsx`
- Trocar chamada de `question-generator` para `micro-quiz`
- Remover mapeamento de campos (a nova function ja retorna no formato correto)
- Adicionar timeout de 12s no client — se nao responder, fallback para "passar direto"

### 3. Deploy
- Deploy da nova edge function

## Arquivos
- **Novo**: `supabase/functions/micro-quiz/index.ts`
- **Editado**: `src/components/daily-plan/MicroQuizDialog.tsx`

## Impacto
- Tempo de resposta: ~15-30s → ~3-5s
- Taxa de sucesso: ~50% → ~95%
- Zero impacto em outras funcionalidades

