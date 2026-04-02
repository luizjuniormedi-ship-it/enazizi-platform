

# Pacote do Agente WhatsApp + Download pelo Painel Admin

## Problema Atual

Os 4 arquivos do agente (`agent.py`, `config.json`, `requirements.txt`, `README.md`) foram gerados como artifacts no ambiente Lovable, mas o usuario nao consegue encontra-los para baixar. Precisamos de duas coisas:

1. Regenerar os arquivos do agente Python como artifacts downloadaveis
2. Adicionar botao de download do pacote direto no painel admin do WhatsApp

## O que ja existe

- Edge Functions `whatsapp-queue` (API da fila) e `whatsapp-auto-send` (envio automatico) ja implementadas
- Tabelas `whatsapp_send_executions`, `whatsapp_execution_logs`, `whatsapp_message_log` ja existem com RLS
- Painel `WhatsAppPanel.tsx` ja tem 3 abas: Mensagens, Execucao Desktop, Historico
- Extensao Chrome ja tem botao de download no painel

## Plano

### Etapa 1 — Regenerar os 4 arquivos do agente como artifacts

Recriar em `/mnt/documents/enazizi-whatsapp-agent/`:

- **agent.py**: Script Python com GUI tkinter, login Supabase, loop de envio via `whatsapp://send` + pyautogui, controle de fila, logs, retomada
- **config.json**: Preenchido com URL do Supabase, credenciais do admin, delays configuraveis
- **requirements.txt**: requests, pyautogui, pyperclip
- **README.md**: Instrucoes passo a passo de instalacao

### Etapa 2 — Empacotar como ZIP

Criar `/mnt/documents/enazizi-whatsapp-agent.zip` com os 4 arquivos para download facil.

### Etapa 3 — Adicionar botao de download no painel admin

Copiar o ZIP para `public/enazizi-whatsapp-agent.zip` e adicionar na aba "Execucao Desktop" do `WhatsAppPanel.tsx`:

- Banner com instrucoes resumidas
- Botao "Baixar Agente Windows" (usando fetch+blob como ja e feito para a extensao)
- Checklist visual: 1) Instale Python, 2) Baixe o agente, 3) Extraia, 4) `py -m pip install -r requirements.txt`, 5) `py agent.py`

### Arquivos criados/alterados

| Arquivo | Acao |
|---------|------|
| `/mnt/documents/enazizi-whatsapp-agent/agent.py` | Criar agente Python |
| `/mnt/documents/enazizi-whatsapp-agent/config.json` | Config preenchida |
| `/mnt/documents/enazizi-whatsapp-agent/requirements.txt` | Dependencias |
| `/mnt/documents/enazizi-whatsapp-agent/README.md` | Instrucoes |
| `/mnt/documents/enazizi-whatsapp-agent.zip` | Pacote ZIP |
| `public/enazizi-whatsapp-agent.zip` | ZIP servido estaticamente |
| `src/components/admin/WhatsAppPanel.tsx` | Botao download + instrucoes na aba Desktop |

