

# Plano: Tutor IA aborda o assunto direto ao clicar no Plano do Dia

## Problema
Ao clicar "Tutor IA" no Plano do Dia, o ChatGPT.tsx recebe `fromErrorBank: true` e define `currentTopic` como "Revisão do Banco de Erros" em vez do tema real (ex: "Sepse", "Cardiologia"). Isso faz o tutor não reconhecer o assunto corretamente.

## Solucao

### 1. Editar `src/pages/DailyPlan.tsx`
- Nas 2 navegações para o Tutor IA (revisões na linha 333 e blocos na linha 414), trocar `fromErrorBank: true` por um novo flag `fromDailyPlan: true` e adicionar o campo `topic` com o nome do tema
- Passar também `specialty` quando disponível (nas revisões, `review.especialidade`)

### 2. Editar `src/pages/ChatGPT.tsx`
- No `useEffect` que trata `location.state` (linha 303), adicionar handler para `fromDailyPlan`:
  - Extrair `state.topic` e `state.initialMessage`
  - Setar `currentTopic` com o tema real (ex: "Sepse")
  - Setar `topic` (input de tema) com o mesmo valor
  - Iniciar estudo automaticamente (`setStudyStarted(true)`)
  - Enviar a mensagem inicial via `sendMessage`

## Resultado
Ao clicar no tema no Plano do Dia, o Tutor IA abre já com o tema correto definido e inicia a aula automaticamente, sem o usuário precisar digitar nada.

## Arquivos
- Editar: `src/pages/DailyPlan.tsx` (2 pontos de navegação)
- Editar: `src/pages/ChatGPT.tsx` (1 novo handler no useEffect)

