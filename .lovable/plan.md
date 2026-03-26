

# Plano: Upload do Cronograma Alimenta Toda a Jornada de Estudo

## Resumo
Hoje, ao gerar o plano de estudos a partir do edital, os temas ja sao inseridos em `temas_estudados` com revisoes automaticas. Porem os outros modulos (Tutor, Questoes, Flashcards, Simulados) nao recebem essa informacao. O plano fecha esse ciclo: apos o upload gerar os temas, o sistema tambem popula os modulos com conteudo direcionado.

## O que muda para o usuario
- Ao gerar cronograma a partir do edital, alem dos temas e revisoes, o sistema:
  1. **Gera flashcards automaticos** para cada tema registrado (via edge function `generate-flashcards`)
  2. **Busca questoes existentes** no banco para cada tema e as vincula ao plano do usuario
  3. **Configura o Tutor IA** com os temas do cronograma como contexto prioritario
  4. **Agenda simulado sugerido** com as materias do plano na aba de Simulados
- Toast informando quantos recursos foram vinculados
- Zero acao extra do usuario — tudo automatico apos gerar o plano

## Alteracoes Tecnicas

### 1. Criar `src/lib/cronogramaSync.ts`
Servico central com funcoes:
- `syncTemasToModules(userId, temas[])` — orquestra a integracao:
  - Busca questoes em `questions_bank` por topico matching e salva referencias
  - Dispara geracao de flashcards para temas sem flashcard existente
  - Registra contexto de estudo para o Tutor IA em `study_performance`
- `getRelatedQuestions(tema, especialidade)` — busca questoes do banco global por topico

### 2. Editar `src/pages/CronogramaInteligente.tsx`
- No callback `onSubjectsGenerated`, apos inserir temas e revisoes, chamar `syncTemasToModules`
- Mostrar toast com resumo: "X temas, Y questoes vinculadas, Z flashcards criados"

### 3. Editar `src/components/cronograma/StudyBlockActions.tsx`
- Adicionar atalho "Gerar Flashcards" que usa os temas do cronograma
- Adicionar atalho "Questoes do Tema" que filtra o banco de questoes pelo tema ativo

### 4. Editar `supabase/functions/generate-study-plan/index.ts`
- Apos gerar o plano, incluir no response um campo `suggestedSimulado` com config de simulado baseado nas materias do plano (quantidade de questoes por area proporcional ao peso)

### 5. Editar `src/components/cronograma/CronogramaAgendaHoje.tsx`
- Na agenda do dia, mostrar link direto para questoes e flashcards relacionados ao tema da revisao

## Arquivos
- Criar: `src/lib/cronogramaSync.ts`
- Editar: `CronogramaInteligente.tsx`, `StudyBlockActions.tsx`, `generate-study-plan/index.ts`, `CronogramaAgendaHoje.tsx`
- Sem migracao SQL — tabelas ja existem

