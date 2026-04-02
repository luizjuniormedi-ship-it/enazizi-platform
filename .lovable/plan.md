

# Mensagem Customizada no Painel WhatsApp

## Resumo
Adicionar um campo de texto no painel WhatsApp do admin para que o administrador possa escrever uma mensagem personalizada que será enviada para todos os alunos, em vez de depender exclusivamente das mensagens geradas por IA.

## Alterações

### `src/components/admin/WhatsAppPanel.tsx`
1. Adicionar novo estado `customMessage` (string) e `useCustomMessage` (boolean toggle)
2. Na aba "Mensagens", antes do botão "Gerar mensagens do dia", adicionar:
   - Um switch/checkbox "Usar mensagem personalizada"
   - Quando ativado, exibir um `Textarea` para o admin escrever a mensagem
   - Placeholder: "Escreva aqui a mensagem que será enviada para todos os alunos..."
3. Ao clicar "Gerar mensagens do dia" com modo customizado:
   - Buscar os alunos normalmente (via `whatsapp-agent`), mas substituir o texto da mensagem de cada aluno pela mensagem customizada
   - Manter as variáveis `{nome}` para personalização — fazer replace do `{nome}` pelo primeiro nome do aluno
4. Se o toggle estiver desativado, comportamento atual (IA gera cada mensagem)

### Fluxo
- Admin ativa "Mensagem personalizada"
- Escreve: "Olá {nome}! Amanhã teremos aula especial às 19h. Não falte! 📚"
- Clica "Gerar mensagens do dia"
- Sistema busca alunos, mas usa a mensagem do admin (com `{nome}` substituído)
- Fila é criada normalmente para o agente desktop

### Detalhes técnicos
- O `generateMessages` continuará chamando `whatsapp-agent` para obter a lista de alunos, mas quando `useCustomMessage` está ativo, sobrescreve `s.message` com a mensagem customizada (fazendo replace de `{nome}`)
- Cada mensagem individual ainda pode ser editada depois (campo Textarea por aluno já existe)
- Adicionar sufixo obrigatório de opt-out: `\n\nResponda SAIR para não receber mais.`

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/WhatsAppPanel.tsx` | Adicionar toggle + textarea para mensagem customizada |

