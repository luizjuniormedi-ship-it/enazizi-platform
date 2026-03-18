

## Sala de Aula via Grupo do Telegram

O bot ja esta criado (ENAZIZI) e o grupo ja existe com o bot como admin. Agora vamos implementar tudo.

### Passos

#### 1. Conectar o bot ENAZIZI ao projeto
Vincular a conexao `ENAZIZI` ao projeto para disponibilizar `TELEGRAM_API_KEY` e `LOVABLE_API_KEY` nas edge functions.

#### 2. Migracao SQL
Adicionar colunas na tabela `video_rooms`:
- `telegram_chat_id` (text) — ID do grupo do Telegram
- `telegram_group_link` (text) — link do grupo (ex: `https://t.me/+abc123`)

#### 3. Nova Edge Function: `telegram-classroom`
- **Acao `start`**: envia mensagem no grupo via gateway `sendMessage`: "📹 Aula ao vivo: {titulo}"
- **Acao `end`**: envia mensagem: "✅ Aula encerrada: {titulo}"
- Valida JWT do professor antes de executar

#### 4. Refatorar `VideoRoom.tsx`
- Remover iframe Jitsi e geracao de URL Jitsi
- Adicionar campos: "Chat ID do grupo" e "Link do grupo do Telegram"
- Ao criar sala: chamar edge function `telegram-classroom` com acao `start`
- Ao encerrar: chamar edge function com acao `end`
- Manter selecao de alunos, filtros e historico

#### 5. Refatorar `ActiveVideoRoomBanner.tsx`
- Botao "Entrar" abre o `telegram_group_link` em nova aba
- Manter logica de matching (invited_students, faculdade, periodo)

### Arquivos
| Arquivo | Mudanca |
|---|---|
| 1 migracao SQL | 2 colunas novas em `video_rooms` |
| `supabase/functions/telegram-classroom/index.ts` | Nova edge function |
| `src/components/professor/VideoRoom.tsx` | Remover Jitsi, adicionar campos Telegram |
| `src/components/dashboard/ActiveVideoRoomBanner.tsx` | Abrir link do Telegram |

