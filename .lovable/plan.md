

# Resolver Mensagens BI Diário Paradas — Agente Não Encontra a Fila

## Diagnóstico

As 112 mensagens do BI diário estão no banco com `delivery_status = 'pending'` e `execution_id = null`. O agente desktop tentou chamar `start_execution` mas a URL foi codificada incorretamente (`%3F` em vez de `?`), resultando em 404. Sem uma execução `running`, o agente não processa a fila.

## Solução

1. **Criar execução manualmente via SQL** — inserir uma execução `running` de `mode = 'desktop'` e vincular as 112 mensagens pendentes do BI a ela. O agente ao chamar `execution_status` (que funciona) vai encontrar a execução ativa e começar a processar.

2. **Alternativa no painel** — o botão "Gerar Mensagens" no WhatsApp Panel já chama `start_execution` pelo painel web (sem bug de URL encoding). Basta clicar nele para criar a execução e vincular os itens pendentes.

## Ação Recomendada

A forma mais rápida é criar a execução via migration SQL diretamente, vinculando as 112 mensagens do BI e deixando o agente processá-las na próxima checagem.

Alternativamente, basta ir ao painel WhatsApp e clicar em "Gerar Mensagens" — isso vai criar uma execução desktop e automaticamente vincular as mensagens pendentes.

| Ação | Detalhe |
|------|---------|
| Criar execução `running` | Via SQL ou botão do painel |
| Vincular 112 mensagens BI | `UPDATE whatsapp_message_log SET execution_id = X WHERE execution_mode = 'daily_bi' AND execution_id IS NULL` |
| Agente processa | Na próxima checagem de `execution_status` |

