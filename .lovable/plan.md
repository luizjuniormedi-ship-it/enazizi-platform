

## Diagnostico: Erro no Gerador de Questoes

### Problema Identificado

Os logs da edge function `question-generator` estao **vazios** (nenhum log encontrado), o que indica que a funcao provavelmente precisa ser reimplantada. Alem disso, os logs de outras funcoes (como `discursive-questions` e `benchmark-percentile`) mostram:

1. **Lovable AI retornando 402** (creditos esgotados), caindo para OpenAI
2. **OpenAI retornando 502 Bad Gateway** (erro temporario do Cloudflare)

O sistema prompt do question-generator e extremamente longo (~5000+ caracteres), o que pode contribuir para timeouts em cenarios de fallback.

### Plano de Correcao

| # | Arquivo | Alteracao |
|---|---------|-----------|
| 1 | `supabase/functions/question-generator/index.ts` | Melhorar error handling: logar status/corpo do erro da IA, tratar 402/429 com mensagens claras para o usuario |
| 2 | `supabase/functions/_shared/ai-fetch.ts` | Adicionar logging quando o fallback OpenAI tambem falha, para diagnostico |
| 3 | Reimplantar (deploy) | Reimplantar a edge function `question-generator` para garantir que esta ativa |

### Detalhes Tecnicos

**1. Melhorar error handling no question-generator:**
- Quando `aiFetch` falha, propagar a mensagem de erro especifica (402 = creditos, 429 = rate limit, 502 = servico indisponivel)
- Adicionar try/catch mais granular ao redor do `aiFetch`

**2. Melhorar ai-fetch.ts:**
- Logar o status e corpo da resposta quando o fallback OpenAI tambem falha
- Consumir o body da resposta do Lovable AI antes de tentar OpenAI (evitar resource leak no Deno)

**3. Reimplantar:**
- Fazer deploy da funcao e testar com invoke para confirmar que funciona

**Total: 2 arquivos editados + 1 deploy + 1 teste.**

