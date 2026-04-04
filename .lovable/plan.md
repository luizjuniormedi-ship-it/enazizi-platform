# Continuidade de Estudo com Modo Recuperação

## O que JÁ existe
- Carryover semanal no `useWeeklyGoals.ts` (50% do deficit, cap 1.5x)
- Study Engine já prioriza revisões atrasadas, erros e FSRS
- Content Lock (blocked/limited) já reduz conteúdo novo
- Memory pressure e adaptive mode funcionam
- Dashboard sync via `useJourneyRefresh`

## O que falta (cirúrgico)

### 1. Modo Recuperação explícito no `AdaptiveState`
**`src/lib/studyEngine.ts`**: Adicionar `recoveryMode: boolean` e `recoveryReason: string` ao `AdaptiveState`. Ativar quando:
- `overdueCount >= 15` OU
- `memoryPressure >= 70` OU
- `approvalScore < 35 && overdueCount >= 8`

Quando ativo: reduzir `maxTotal` de 8→5 tarefas, zerar `maxNewTopics`, boost +15 em revisões/erros.

### 2. Banner de Recuperação no Dashboard
**Novo: `src/components/dashboard/RecoveryModeBanner.tsx`**: Banner motivador quando `adaptive.recoveryMode === true`, com mensagem tipo "Vamos reorganizar seu plano para você retomar o ritmo."

### 3. HeroStudyCard adapta título
**`src/components/dashboard/HeroStudyCard.tsx`**: Quando em recovery mode, título muda para "Modo recuperação ativo" com subtitle motivador.

### 4. WhatsApp recovery message
**`src/lib/messageLibrary.ts`**: Adicionar template de mensagem para modo recuperação (já tem sistema de mensagens humanizadas).

## O que NÃO muda
- Study Engine core, FSRS, cronograma, missão
- Carryover semanal (já implementado)
- Nenhuma tabela nova
- Nenhum dado mockado
