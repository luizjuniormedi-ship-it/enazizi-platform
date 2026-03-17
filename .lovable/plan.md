

# Plano: Aumentar limite de questões e organizar por blocos temáticos

## Resumo

Três alterações principais: (1) aumentar as opções de quantidade de questões, (2) atualizar o prompt da IA para organizar questões por blocos temáticos, (3) exibir cabeçalhos de bloco tanto na pré-visualização do professor quanto na view do aluno.

---

## Alterações

### 1. Aumentar opções de quantidade de questões
**Arquivo:** `src/pages/ProfessorDashboard.tsx` (linha 541)

Trocar `[5, 10, 15, 20, 30]` por `[5, 10, 15, 20, 30, 40, 50, 60, 80, 100]`.

### 2. Atualizar prompt da IA para incluir campo `block`
**Arquivo:** `supabase/functions/professor-simulado/index.ts` (linhas 42-63)

- Adicionar campo `"block"` no formato JSON de saída
- Instruir a IA a agrupar questões por tema/bloco e distribuir proporcionalmente entre os tópicos selecionados
- Quando múltiplos temas forem selecionados, a IA deve gerar blocos separados (ex: "Bloco: Cardiologia", "Bloco: Farmacologia")

### 3. Exibir cabeçalhos de bloco na pré-visualização do professor
**Arquivo:** `src/pages/ProfessorDashboard.tsx` (linhas 636-658)

- Agrupar questões geradas pelo campo `block` ou `topic`
- Renderizar um separador/cabeçalho antes de cada grupo (ex: `📋 Bloco: Cardiologia — 5 questões`)
- Manter o badge de tópico individual em cada questão

### 4. Exibir bloco temático na view do aluno durante o simulado
**Arquivo:** `src/pages/StudentSimulados.tsx` (linhas 362-370)

- Mostrar o nome do bloco acima de cada questão quando disponível (campo `block`)
- Quando o aluno muda de bloco, exibir um indicador visual (ex: badge colorido ou separador com o nome do bloco)

---

## Detalhes técnicos

- Nenhuma alteração no banco de dados é necessária — `questions_json` já é JSONB e aceita campos adicionais
- O campo `block` será extraído do JSON gerado pela IA junto com `topic`, `statement`, `options`, etc.
- Para agrupar no frontend, usar `reduce` para criar um mapa `block → questões[]` e renderizar com headers

