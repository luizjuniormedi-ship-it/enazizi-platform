

# Plano: Corrigir extração de questões reais (search-real-questions)

## Problemas identificados nos logs

1. **JSON truncado da IA**: O log mostra "Failed to parse AI JSON response" com uma questão válida cortada no meio. A IA gera respostas longas que excedem o limite e o JSON fica incompleto
2. **Respostas vazias**: "AI raw response length: 33" = a IA retorna `{"questions": []}` mesmo com conteúdo válido de 64k+ chars, porque o conteúdo é truncado demais (12k chars) e perde as questões
3. **Truncamento agressivo do conteúdo**: Fontes como `endocrino.org.br` (88k chars) ou `qconcursos.com` (64k chars) são cortadas para apenas 12k chars, perdendo as questões que estão mais no meio/final do documento
4. **Deduplicação limitada**: Só verifica os últimos 30 statements, insuficiente para evitar duplicatas a longo prazo

## Solução

### Editar: `supabase/functions/search-real-questions/index.ts`

**1. Melhorar extração de conteúdo relevante (pré-filtro inteligente)**
- Antes de truncar, fazer um pré-filtro: buscar blocos de texto que contenham padrões de questões (`[A-E]\)`, numeração `1.`, `2.`, `Questão`, `alternativa`)
- Extrair apenas os trechos que parecem questões em vez de pegar os primeiros 12k chars cegamente
- Aumentar limite por fonte de 12k para 18k chars

**2. Corrigir parsing de JSON truncado**
- Se o JSON falhar no parse, tentar recuperar questões parciais: