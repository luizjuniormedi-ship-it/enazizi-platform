

# Reprocessar REVALIDA + Preparar Módulo Prova na Íntegra

## Situação Atual

- **835 questões REVALIDA** já existem no `questions_bank`, mas fragmentadas em ~28 fontes diferentes
- O upload "PROVAS REVALIDA 2011 A 2024.2 COMENTADAS.txt" gerou apenas 28 questões de um arquivo com provas de 14 anos -- o pipeline `process-upload` não foi projetado para extrair questões literais, ele gera questões novas com IA
- Provas com volume viável: REVALIDA 2020 (~182q), 2022 (~43q), 2024 (~45q), 2025/2026 (~46q cada)
- A tabela `exam_banks` existe mas não tem vínculo formal com `questions_bank`

## Plano em 2 Etapas

### Etapa 1: Reprocessar o TXT do REVALIDA com extração fiel

Criar uma edge function `extract-exam-questions` que:
1. Lê o arquivo TXT do storage (`PROVAS REVALIDA 2011 A 2024.2 COMENTADAS.txt`)
2. Usa o parser `parseQuestionsFromText` existente para extrair questões literais (sem IA inventar)
3. Agrupa por ano usando regex no texto (ex: "REVALIDA 2011", "REVALIDA 2012", etc.)
4. Insere no `questions_bank` com `source = "REVALIDA INEP {ano}"` e `is_global = true`
5. Cria entradas no `exam_banks` para cada ano encontrado

### Etapa 2: Vincular questões existentes aos exam_banks

**Migração SQL:**
- Adicionar coluna `exam_bank_id uuid REFERENCES exam_banks(id)` na tabela `questions_bank`
- Adicionar coluna `question_order integer` na `questions_bank`

**Edge function ou script:**
- Associar as 835 questões existentes aos `exam_banks` correspondentes usando match no campo `source`
- Consolidar duplicatas entre fontes (ex: REVALIDA 2020 tem 3 fontes com ~281 questões, provavelmente muitas duplicadas)

### Etapa 3: Módulo Prova na Íntegra (conforme plano anterior já aprovado)

Só faz sentido implementar após ter pelo menos 3-4 provas completas (60+ questões cada) vinculadas.

## Detalhes Técnicos

### Arquivos impactados
- `supabase/functions/extract-exam-questions/index.ts` -- nova edge function
- 1 migração SQL (colunas `exam_bank_id` e `question_order`)
- `src/lib/parseQuestions.ts` -- reutilizado (já existe)
- Painel Admin: botão para disparar reprocessamento

### Dependência
O arquivo TXT já está no storage em `92736dea.../1774221285261_PROVAS_REVALIDA__2011_A_2024.2_COMENTADAS.txt`. Precisa ser lido e parseado completamente (sem limite de páginas/tokens).

