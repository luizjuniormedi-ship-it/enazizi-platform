

# Resposta: Mensagem Personalizada Respeita o Opt-Out

## Como funciona hoje

Quando você ativa "Usar mensagem personalizada" e clica "Gerar mensagens do dia":

1. O sistema chama a mesma função backend (`whatsapp-agent`) que filtra os alunos
2. Essa função **exclui automaticamente** quem:
   - Marcou `whatsapp_opt_out = true` (respondeu SAIR)
   - Está bloqueado (`is_blocked = true`)
   - Não tem telefone cadastrado
   - Não está com status `active`
3. Só depois de receber a lista filtrada, o sistema substitui o texto da IA pelo texto que você digitou

**Resultado**: A mensagem personalizada vai para todos os alunos elegíveis, **respeitando** quem escolheu sair. Quem pediu SAIR **não recebe**.

## Nenhuma alteração necessária

O comportamento já está correto — o opt-out é respeitado tanto para mensagens geradas por IA quanto para mensagens personalizadas.

Se você quiser que a mensagem personalizada **ignore** o opt-out (envie para todos mesmo), isso precisaria de uma alteração separada.

