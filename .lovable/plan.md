

# Detalhamento de Resultados por Aluno + Banco de Erros na Proficiência

## Situação Atual

- **Professor**: O dialog de resultados mostra apenas nome do aluno + score %. Não tem drill-down por questão.
- **Aluno**: Já possui gabarito comentado após o simulado (com explicações e botão "Estudar com Tutor IA"). Porém, na listagem de simulados concluídos em Proficiência, não há forma de revisitar o gabarito nem um resumo de erros para revisão rápida.

## Mudanças

### 1. Professor — Drill-down por aluno no dialog de resultados

**`src/pages/ProfessorDashboard.tsx`** (dialog de resultados, linhas 763-787)

- Adicionar estado `expandedStudent` para controlar qual aluno está expandido
- Ao clicar no card do aluno (nome), expandir para mostrar:
  - Lista de questões com indicador ✓/✗
  - Para cada erro: enunciado resumido, resposta do aluno, resposta correta, explicação
  - Porcentagem por tópico
- Os dados já estão disponíveis: `answers_json` no resultado contém `{ question_index, selected, correct_index, is_correct, topic }` e `questions_json` no simulado contém os enunciados

### 2. Aluno — Botão "Ver Gabarito" nos simulados concluídos em Proficiência

**`src/pages/StudentSimulados.tsx`** (listagem de concluídos, ~linha 413-441)

- Adicionar botão "Ver Gabarito" nos simulados concluídos
- Ao clicar, remontar o `resultData` a partir de `answers_json` e exibir a view de resultado (que já tem gabarito comentado completo)

### 3. Aluno — Seção "Erros deste Simulado" com redirecionamento automático ao Tutor

**`src/pages/StudentSimulados.tsx`** (result view, ~linha 966)

- Após a revisão das questões, adicionar seção "Banco de Erros do Simulado" com cards dos temas errados agrupados
- Cada card mostra: tema, quantidade de erros, botão "Revisar com Tutor IA" que envia o contexto automaticamente
- Os erros já são logados no `error_bank` via `logErrorToBank` durante o submit

### 4. Edge Function — Retornar `questions_json` junto com resultados

**`supabase/functions/professor-simulado/index.ts`** (action `get_simulado_results`)

- Buscar `questions_json` do simulado e incluir no retorno para que o professor tenha acesso aos enunciados ao expandir o aluno

## Detalhes técnicos

- `answers_json` já contém `question_index`, `selected`, `correct_index`, `is_correct`, `topic` — dados suficientes para o drill-down
- `questions_json` contém `statement`, `options`, `correct_index`, `topic`, `explanation`
- O gabarito comentado do aluno já funciona na view de resultado — basta permitir reacesso
- Nenhuma migração de banco necessária

