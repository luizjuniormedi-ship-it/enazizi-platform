
# Plano: Corrigir botão MissionEntry para abrir Dashboard com missão ativa

## Problema
O botão "COMEÇAR MISSÃO" na MissionEntry chama `startMission()` e navega para `/dashboard`. Porém, `startMission()` depende de `recommendations` do `useStudyEngine()`, que pode ainda não ter carregado no contexto da MissionEntry — resultando em `tasks.length === 0` e retorno silencioso (linha 73). O usuário chega ao Dashboard com missão `idle`, sem o painel de missão ativo.

## Solução
Alterar `handleStart` na MissionEntry para aguardar as recomendações antes de iniciar, ou navegar para o Dashboard e deixar o `MissionStartButton` do Dashboard lidar com o início (já que lá o hook tem os dados carregados).

A abordagem mais robusta: em vez de tentar `startMission()` na MissionEntry (onde os dados podem não estar prontos), apenas navegar para `/dashboard` com um query param `?autostart=mission`. No Dashboard, o `MissionStartButton` detecta esse param e dispara `startMission()` automaticamente quando as recomendações estiverem prontas.

## Arquivos a alterar

### 1. `src/pages/MissionEntry.tsx`
- Simplificar `handleStart`: remover chamadas a `startMission`/`resumeMission`
- Navegar para `/dashboard?autostart=mission`

### 2. `src/components/dashboard/MissionStartButton.tsx`
- Ler query param `autostart=mission`
- Quando presente e `state.status === "idle"` e `hasTasks` e não `engineLoading`: chamar `startMission()` automaticamente e limpar o param
- Isso garante que o start só acontece quando os dados estão prontos

## O que NÃO muda
- `useMissionMode.ts`, `MissionMode.tsx`, rotas, Study Engine
