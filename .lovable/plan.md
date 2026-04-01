

# Equacionamento de Questões por Especialidade

## Situação Atual

Cardiologia tem 1.339 questões enquanto Parasitologia tem 16. Precisamos nivelar.

## Alvos

- Especialidades clínicas (Internato + Ciclo Clínico): **250** questões cada
- Ciências básicas (Ciclo Básico): **150** cada
- Especialidades já acima do alvo (Cardiologia, Ginecologia, Cirurgia, Pediatria, Clínica Médica, ENARE, Geral): **pular**

## Mudanças

### 1. `supabase/functions/bulk-generate-content/index.ts`

- Corrigir nomes no array `SPECIALTIES`: `"Cirurgia Geral"` → `"Cirurgia"`, `"Emergência"` → `"Medicina de Emergência"`
- Adicionar constante `BASIC_SCIENCES` com lista das especialidades do ciclo básico
- Adicionar constante `TARGET_CLINICAL = 250`, `TARGET_BASIC = 150`
- Novo modo `equalize`: quando `body.equalize = true`:
  - Query contagem por tópico no banco
  - Calcular déficit para cada especialidade
  - Processar até 5 especialidades com maior déficit
  - Gerar apenas o necessário (ajustar prompt para pedir menos questões se déficit < 25)
  - Retornar relatório com déficits restantes
- Antes de gerar por IA, buscar na `real_exam_questions` questões do mesmo tópico não importadas e importá-las primeiro

### 2. `src/components/admin/AdminIngestionPanel.tsx`

- Nova aba **"Equilíbrio"** com:
  - Tabela de todas as especialidades mostrando: nome, total atual, alvo, déficit, barra de progresso
  - Cores: verde (≥80% alvo), amarelo (40-80%), vermelho (<40%)
  - Botão **"Equalizar Banco"** que chama `bulk-generate-content` com `{ equalize: true }`
  - Indicador de progresso durante geração

### 3. Resultado esperado

Após 3-4 execuções: todas as 34+ especialidades com pelo menos 150 questões, clínicas com ~250. Cardiologia não recebe mais até as outras alcançarem.

## Detalhes técnicos

- O `generateBatch` já aceita quantidade via prompt — ajustar para pedir `Math.min(25, deficit)` questões
- A query de contagem usa `questions_bank.topic` com `is_global = true`
- Import de `real_exam_questions`: match por `topic`, insert no `questions_bank` com `source = 'real_exam_import'`

