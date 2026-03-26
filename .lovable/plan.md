

# Melhorias Didáticas na Jornada de Estudo

## O que já existe
- Tutor IA com protocolo ENAZIZI (12 etapas), micro-quiz, Pomodoro, mastery badge, drag & drop, celebração 100%
- Flashcards e Questões como ações rápidas nos cards

## Melhorias propostas (baseadas em Anki, Osmosis, Lecturio, Amboss)

### 1. Resumo pré-aula em cada card do Plano do Dia
Antes de clicar "Tutor IA", o usuário não sabe o que vai estudar. Adicionar um **mini-resumo de 2 linhas** gerado pela IA em cada card (ex: "Sepse: resposta inflamatória sistêmica a infecção. Foco: critérios SOFA, manejo inicial em 1h").

**Implementação**: No `learning-optimizer`, pedir que cada bloco retorne um campo `summary` (2 frases). Exibir abaixo da descrição no card.

### 2. Objetivo de aprendizagem por bloco
Cada card mostra "o que estudar" mas não "o que o aluno deve saber ao final". Adicionar um campo `learningGoal` (ex: "Ao final, você saberá aplicar os critérios qSOFA e iniciar o pacote de 1h").

**Implementação**: Adicionar campo `learning_goal` no prompt do `learning-optimizer`. Renderizar com ícone 🎯 no card.

### 3. Conexão entre temas (mapa de pré-requisitos)
Quando o aluno vai estudar "Choque Séptico", indicar que precisa dominar "Sepse" primeiro. Mostrar um **badge de pré-requisito** quando o tema depende de outro que o aluno ainda não dominou.

**Implementação**: No prompt do `learning-optimizer`, pedir `prerequisite` opcional por bloco. Se existir e o aluno não tiver mastery ≥ intermediário nesse tema, mostrar alerta "📌 Revise primeiro: Sepse".

### 4. Autoavaliação pós-estudo (além do micro-quiz)
Após concluir um bloco com Tutor IA, pedir ao aluno uma **autoavaliação de confiança** (1-5 estrelas: "Quanto você se sente preparado?"). Isso alimenta o algoritmo de repetição espaçada.

**Implementação**: Novo componente `SelfAssessmentDialog.tsx`. Ao marcar bloco como concluído, abrir dialog com escala 1-5. Salvar na tabela `revisoes` ou `practice_attempts`.

### 5. Dica do dia contextualizada por erro
As "Dicas do dia" atuais são genéricas. Melhorar para que a IA gere dicas baseadas nos **erros recentes** do aluno (ex: "Você errou 3x em Farmacologia — revise interações CYP450").

**Implementação**: Enviar `error_bank` resumido no body do `learning-optimizer` para gerar `tips` personalizadas.

## Alterações técnicas

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/learning-optimizer/index.ts` | Adicionar `summary`, `learning_goal`, `prerequisite` ao schema dos blocos; receber `error_bank` para gerar tips personalizadas |
| `src/pages/DailyPlan.tsx` | Renderizar `summary`, `learning_goal`, badge de pré-requisito em cada card |
| `src/components/daily-plan/DailyPlanTypes.ts` | Adicionar campos `summary`, `learning_goal`, `prerequisite` ao tipo `StudyBlock` |
| `src/components/daily-plan/SelfAssessmentDialog.tsx` | Novo componente com escala 1-5 estrelas |

