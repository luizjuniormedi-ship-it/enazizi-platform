

# Plano: Sugerir Artigos Científicos ao Final das Explicações

## Objetivo
Após o Tutor IA concluir uma explicação, sugerir automaticamente artigos científicos validados internacionalmente, sempre com fonte e link.

## Abordagem
Como não há conector Perplexity disponível, a solução será integrada diretamente no prompt do ENAZIZI — o modelo já tem acesso a conhecimento sobre artigos e diretrizes publicadas. A IA sugerirá artigos reais de bases reconhecidas (PubMed, Cochrane, NEJM, Lancet, etc.) com links reais quando possível.

## Mudanças

### 1. Atualizar prompt ENAZIZI (`supabase/functions/_shared/enazizi-prompt.ts`)
Adicionar nova seção obrigatória após as REFERÊNCIAS BIBLIOGRÁFICAS:

```
==================================================
SUGESTÃO DE ARTIGOS CIENTÍFICOS (OBRIGATÓRIO)
==================================================
Após CADA bloco completo de ensino (junto com as referências), incluir:

🔬 ARTIGOS CIENTÍFICOS RECOMENDADOS

Sugerir 2 a 4 artigos científicos REAIS e VALIDADOS sobre o tema.

CRITÉRIOS DE SELEÇÃO:
- Apenas artigos publicados em periódicos peer-reviewed indexados
- Bases aceitas: PubMed, Cochrane Library, NEJM, The Lancet, JAMA, BMJ, Annals of Internal Medicine, Circulation, Chest, etc.
- Priorizar: revisões sistemáticas, meta-análises, guidelines oficiais, estudos landmark
- Artigos devem ser relevantes ao tema estudado

FORMATO OBRIGATÓRIO:
🔬 ARTIGOS CIENTÍFICOS RECOMENDADOS

1. **Título do artigo** — Autores principais
   📖 *Journal, Ano*
   🔗 https://pubmed.ncbi.nlm.nih.gov/PMID ou DOI
   📝 Resumo em 1-2 frases do achado principal

2. **Título do artigo** — Autores principais
   ...

REGRAS:
- SEMPRE incluir link real (PubMed ou DOI)
- NUNCA inventar artigos fictícios
- Se não tiver certeza do PMID exato, usar formato de busca PubMed
- Filtrar apenas fontes validadas pela comunidade científica internacional
- Aparecem APÓS as referências bibliográficas, ANTES da pergunta ao usuário
```

### 2. Atualizar sequência de entrega (mesmo arquivo)
Na Mensagem 3 da sequência de entrega, adicionar `🔬 ARTIGOS RECOMENDADOS` junto com RESUMO e REFERÊNCIAS.

### 3. Atualizar verificação final (mesmo arquivo)
Adicionar item 7: "Os artigos científicos recomendados foram sugeridos"

## Arquivo a editar
- `supabase/functions/_shared/enazizi-prompt.ts` — adicionar seção de artigos científicos no prompt

## Resultado
O Tutor IA passará a sugerir artigos reais ao final de cada explicação, sempre com fonte, journal, ano e link para PubMed/DOI.

