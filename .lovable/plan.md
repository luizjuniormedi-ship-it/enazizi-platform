

# Padronizar Questões: 5 Alternativas + Filtrar Referências a Imagem

## Diagnóstico do Banco Atual

| Nº Alternativas | Questões | % |
|---|---|---|
| 4 | 5.903 | 63% |
| 5 | 3.052 | 33% |
| 2-3 | 101 | 1% |
| 6+ | 198 | 2% |
| Sem opções | 67 | 1% |
| **Com referência a imagem** | **384** | **4%** |
| **Total** | **9.321** | |

## Mudanças

### 1. Migração SQL — Limpeza em massa

Script SQL que:
- **Deleta** questões com referência a imagem/figura/texto que não temos (`statement ILIKE '%na imagem%' OR '%observe a figura%' OR '%imagem abaixo%' OR '%texto abaixo%' OR '%radiografia abaixo%' OR '%fotografia%'` etc.) — ~384 questões
- **Deleta** questões com 0-1 opções (inválidas) — ~67 questões
- **Deleta** questões com 6+ opções (malformadas) — ~198 questões
- Questões com 2-3 opções: deletar (Certo/Errado sem contexto CESPE não se aplica ao formato desejado)

### 2. Edge Functions — Filtro na entrada (6 arquivos)

Em todos os pipelines de geração/extração, adicionar:
- **Filtro de imagem**: rejeitar questões cujo `statement` contenha padrões como `imagem abaixo`, `figura`, `observe a foto`, `radiografia abaixo`, `texto abaixo`
- **Filtro de 5 opções**: exigir `options.length === 5` (rejeitar < 5 ou > 5)
- **Prompt atualizado**: instruir a IA a sempre gerar exatamente 5 alternativas (A-E)

Arquivos afetados:
- `populate-questions/index.ts`
- `extract-exam-questions/index.ts`
- `bulk-generate-content/index.ts`
- `enamed-generator/index.ts`
- `daily-question-generator/index.ts`
- `process-upload/index.ts`

O filtro será um regex compartilhado:
```text
IMAGE_REF_PATTERN = /\b(imagem abaixo|figura abaixo|observe a imagem|na imagem|na figura|texto abaixo|radiografia abaixo|fotografia|ECG abaixo|tomografia abaixo|observe o gráfico)\b/i
```

### 3. Frontend — Validação no `QuestionsBank.tsx`

- Na query de listagem, filtrar questões com exatamente 5 opções no frontend (defesa extra)
- Garantir que a renderização sempre use letras A-E

### 4. Coluna `image_url` (futuro)

Adicionar coluna `image_url text` na tabela `questions_bank` para quando tivermos suporte a imagens vinculadas. Por enquanto, questões com referência a imagem são rejeitadas.

## Impacto

- ~649 questões removidas (baixa qualidade / sem imagem)
- 6 edge functions padronizadas
- Banco limpo com ~8.672 questões, todas com 5 alternativas

