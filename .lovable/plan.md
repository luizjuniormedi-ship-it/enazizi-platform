

# Plano: Elevar Padrão das Questões para Nível de Prova Real

## Diagnóstico Atual

| Métrica | Quantidade | % |
|---|---|---|
| Aprovadas total | 12.434 | 100% |
| Enunciado < 200 chars (muito curtas) | 3.526 | 28% |
| Enunciado < 400 chars (sem caso clínico) | 7.423 | 60% |
| Padrão prova (≥ 400 chars) | 5.011 | 40% |

Exemplos problemáticos encontrados:
- "Qual a principal diferença entre desfibrilação e cardioversão elétrica?" (71 chars)
- "Paciente de 65 anos relata dor no ombro..." (133 chars)

Questões de prova real (ENARE, REVALIDA) têm 400-800+ caracteres com caso clínico completo.

---

## Estratégia em 3 Frentes

### Frente 1 — Rebaixar questões fora do padrão (migration)
- Mover todas as aprovadas com `length(statement) < 200` de volta para `review_status = 'needs_upgrade'`
- Isso as **remove dos fluxos do aluno** sem deletar
- Questões entre 200-399 chars ficam com flag `quality_tier = 'basic'` para uso secundário

### Frente 2 — Reforçar validação nos geradores (edge functions)
- **enamed-generator**: Já tem regras boas, mas adicionar validação pós-geração que rejeita questões < 400 chars antes de gravar
- **populate-questions**: Adicionar as mesmas regras de caso clínico obrigatório no prompt
- **search-real-questions**: Manter como está (questões reais preservam fidelidade)
- Criar função de validação comum `validateQuestionQuality()` reutilizada por todos os geradores

### Frente 3 — Enriquecimento automático das questões curtas (edge function nova)
- Criar edge function `upgrade-questions` que pega questões `needs_upgrade` em lotes
- Usa IA para expandir cada enunciado curto em caso clínico completo padrão ENAMED
- Preserva o tema, alternativas e gabarito original
- Grava como nova versão com `source = 'ai-upgraded'`
- Admin revisa antes de aprovar

---

## Detalhamento Técnico

### Migration SQL
- Adicionar coluna `quality_tier` (text: 'exam_standard', 'basic', 'needs_upgrade')
- UPDATE em massa baseado em `length(statement)`
- Índice em `quality_tier` para queries eficientes

### Validação centralizada (novo arquivo)
```
validateQuestionQuality(statement, options):
  - statement >= 400 chars
  - 5 alternativas
  - contém dados clínicos (idade, sexo, sinais vitais)
  - não referencia imagens/figuras
  - idioma pt-BR
```

### Edge function `upgrade-questions`
- Recebe batch de IDs
- Para cada questão curta, gera prompt pedindo expansão em caso clínico completo
- Preserva gabarito e tema
- Grava com `review_status = 'pending'`

### Filtros nos fluxos do aluno
- Simulados, missões e tutor passam a filtrar `quality_tier IN ('exam_standard')` ou `length(statement) >= 400`

---

## Arquivos a Alterar/Criar

1. **Migration SQL** — coluna `quality_tier`, UPDATE em massa, índice
2. **`supabase/functions/upgrade-questions/index.ts`** — nova edge function de enriquecimento
3. **`supabase/functions/enamed-generator/index.ts`** — validação pós-geração
4. **`supabase/functions/populate-questions/index.ts`** — prompt reforçado + validação
5. **`src/components/admin/AdminQuestionReviewPanel.tsx`** — filtro por quality_tier, botão "Enriquecer"
6. **Hooks de simulado/missão** — filtrar por qualidade mínima

---

## Resultado Esperado

- 0 questões curtas chegam ao aluno
- Novos geradores produzem apenas padrão prova
- Questões antigas podem ser enriquecidas sob demanda pelo admin
- Qualidade auditável via `quality_tier`

