

# Plano: Melhorar Jornada Pos-Upload do Cronograma

## Problema Atual
1. Apos gerar o plano, o usuario ve um toast rapido e nao tem um resumo claro do que foi sincronizado
2. Os subtopicos do `topicMap` nao sao salvos na tabela `temas_estudados` (coluna `subtopico` existe mas nao e usada)
3. Nao ha barra de progresso durante a sincronizacao
4. Apos gerar, o usuario continua na mesma tela sem redirecionamento para a agenda do dia

## Alteracoes

### 1. Adicionar Progresso Visual na Geracao (`StudyPlanContent.tsx`)
- Substituir o simples "Gerando cronograma com IA..." por uma barra de progresso com etapas:
  - "Analisando documento..." → "Extraindo temas..." → "Gerando cronograma..." → "Sincronizando modulos..."
- Usar o componente `Progress` existente com texto da etapa atual

### 2. Salvar Subtopicos na tabela `temas_estudados` (`CronogramaInteligente.tsx`)
- No `onSubjectsGenerated`, cruzar o `topicMap` (disponivel no `plan_json`) com os subjects para inserir cada tema com seus subtopicos
- Usar a coluna `subtopico` ja existente, salvando os subtopicos como string separada por virgula
- Ou inserir uma linha por subtopico (com o tema pai no campo `tema`)

### 3. Mostrar Resumo Pos-Sincronizacao (`StudyPlanContent.tsx`)
- Apos `onSubjectsGenerated` completar, exibir um card de resumo inline (nao apenas toast):
  - Total de temas registrados
  - Flashcards criados
  - Questoes encontradas
  - Revisoes agendadas
  - Botoes: "Ver Agenda de Hoje", "Ver Mapa de Topicos", "Ir para Flashcards"

### 4. Redirecionar para Agenda (`CronogramaInteligente.tsx`)
- Apos a sincronizacao, mudar automaticamente a tab para "hoje" (agenda do dia) com um delay de 2s mostrando o resumo

## Arquivos
- Editar: `src/components/cronograma/StudyPlanContent.tsx` (progresso visual + resumo pos-sync)
- Editar: `src/pages/CronogramaInteligente.tsx` (salvar subtopicos + redirecionar tab)

## Sem migracao SQL — coluna `subtopico` ja existe em `temas_estudados`

