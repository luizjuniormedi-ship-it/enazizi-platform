

# Botão "Excluir Mensagens Geradas" na aba WhatsApp

## Resumo
Adicionar um botão para limpar/excluir as mensagens geradas do dia que ainda estão pendentes, tanto da lista local quanto da tabela `whatsapp_message_log` no banco.

## Alteração

### `src/components/admin/WhatsAppPanel.tsx`

1. **Adicionar função `handleDeleteGenerated`**:
   - Deleta da tabela `whatsapp_message_log` todos os itens com `delivery_status = 'pending'` do dia atual
   - Limpa o estado local `students`, `editedMessages`, `sentUsers`
   - Se houver execução ativa (`activeExecution`), marca como `stopped`
   - Exibe toast de confirmação

2. **Adicionar botão na UI** ao lado do botão "Gerar mensagens do dia":
   - Ícone de lixeira (Trash2)
   - Texto: "Excluir pendentes"
   - Variante `destructive`, visível apenas quando há `students.length > 0`
   - Confirmação via `window.confirm` antes de executar

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/WhatsAppPanel.tsx` | Adicionar botão + função de exclusão de mensagens pendentes |

