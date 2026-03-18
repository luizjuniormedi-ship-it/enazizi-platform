

# Popup de Aula ao Vivo para Alunos Convidados

## Objetivo
Quando uma sala de aula é criada e há alunos convidados, exibir um **popup/dialog modal** (não apenas o banner) com o link do Telegram para que o aluno clique e seja redirecionado. O popup será mais visível e urgente que o banner atual.

## Mudanças

### 1. Criar componente `ActiveVideoRoomPopup`
Novo arquivo: `src/components/dashboard/ActiveVideoRoomPopup.tsx`

- Reutilizar a mesma lógica de detecção do `ActiveVideoRoomBanner` (buscar salas ativas, verificar se o aluno está na lista `invited_students`)
- Exibir um `Dialog` modal com:
  - Título da aula ao vivo
  - Mensagem informando que o professor iniciou uma aula
  - Botão "Entrar na Aula" que abre o link do Telegram (`window.open`)
  - Botão "Depois" para fechar o popup
- Guardar no `sessionStorage` se o aluno já dispensou o popup daquela sala específica (para não aparecer novamente na mesma sessão)
- Polling a cada 30s para detectar novas salas

### 2. Adicionar o popup no Dashboard
Arquivo: `src/pages/Dashboard.tsx`

- Importar e renderizar `<ActiveVideoRoomPopup />` junto com o banner existente
- O banner continua visível como lembrete permanente; o popup aparece uma vez como alerta urgente

### 3. Manter o banner existente
O `ActiveVideoRoomBanner` continua funcionando normalmente como indicador visual persistente no dashboard.

## Fluxo do aluno
1. Professor cria sala → notificação no Telegram + sala salva no banco
2. Aluno abre/está no Dashboard → popup modal aparece com link do Telegram
3. Aluno clica "Entrar" → abre Telegram em nova aba
4. Se fechar o popup → banner permanece visível no topo do dashboard

