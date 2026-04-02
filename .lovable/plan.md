

# Opt-out de Mensagens WhatsApp

## Resumo
Adicionar nas mensagens WhatsApp uma frase de opt-out (ex: "Responda SAIR para não receber mais") e criar um sistema para processar respostas "SAIR"/"NÃO", excluindo o aluno dos envios futuros.

## Alterações

### 1. Nova coluna no `profiles` — `whatsapp_opt_out`
Migração SQL:
```sql
ALTER TABLE profiles ADD COLUMN whatsapp_opt_out boolean NOT NULL DEFAULT false;
```

### 2. Atualizar prompts de geração de mensagem
Em **ambas** as edge functions (`whatsapp-agent/index.ts` e `whatsapp-auto-send/index.ts`), adicionar ao prompt da IA:
```
A mensagem DEVE terminar com:
"Responda SAIR para não receber mais."
```

### 3. Filtrar alunos com opt-out nas consultas
Em ambas as edge functions, adicionar `.eq("whatsapp_opt_out", false)` na query de profiles, para que alunos que optaram por sair não recebam mensagens.

### 4. Nova edge function `whatsapp-opt-out`
Endpoint simples que o agente Python chama quando detecta uma resposta do aluno:
- Recebe `{ phone, reply }` 
- Se `reply` contém "SAIR" ou "NÃO" → marca `whatsapp_opt_out = true` no perfil
- Se `reply` contém "SIM" ou "VOLTAR" → marca `whatsapp_opt_out = false`
- Retorna status da operação

### 5. Painel admin — visibilidade
No `WhatsAppPanel.tsx`, mostrar badge/indicador de quantos alunos fizeram opt-out, e permitir ao admin ver e reverter opt-outs manualmente.

## Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Adicionar coluna `whatsapp_opt_out` em `profiles` |
| `supabase/functions/whatsapp-agent/index.ts` | Filtrar opt-out + adicionar frase no prompt |
| `supabase/functions/whatsapp-auto-send/index.ts` | Filtrar opt-out + adicionar frase no prompt |
| `supabase/functions/whatsapp-opt-out/index.ts` | Nova função para processar respostas |
| `src/components/admin/WhatsAppPanel.tsx` | Mostrar contagem de opt-outs |

