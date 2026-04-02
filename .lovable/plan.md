

# Solucao Integrada: Painel de Execucao + Agente Windows para WhatsApp Desktop

## Visao Geral

Expandir o modulo WhatsApp existente com: (1) banco de dados para fila/execucoes, (2) Edge Function de API para o agente, (3) painel de execucao no admin, (4) agente Python local para Windows.

## Ordem de Implementacao

### Etapa 1 — Migration SQL

Expandir `whatsapp_message_log` com novas colunas e criar 2 tabelas novas.

**Expandir `whatsapp_message_log`:**
- `execution_id` (uuid, nullable, FK para execucoes)
- `delivery_status` (text, default 'pending')
- `attempts` (integer, default 0)
- `error_message` (text, nullable)
- `execution_mode` (text, default 'manual')
- `updated_at` (timestamptz, default now())

**Criar `whatsapp_send_executions`:**
- id, admin_user_id, execution_date, mode, status, total_items, total_sent, total_error, total_skipped, started_at, finished_at, created_at, updated_at
- RLS: apenas admins (CRUD)

**Criar `whatsapp_execution_logs`:**
- id, execution_id, queue_item_id, action, status, message, metadata_json, created_at
- RLS: apenas admins (SELECT, INSERT)

Trigger `update_updated_at` nas tabelas com `updated_at`.

### Etapa 2 — Edge Function `whatsapp-queue`

Nova Edge Function que serve como API REST para o agente local. Autenticacao via JWT + verificacao admin.

Acoes (via query param `action`):
- `start_execution` — cria execucao, associa itens pendentes do dia
- `next_item` — retorna proximo item com `delivery_status = 'pending'` da execucao ativa, marca como `processing`
- `update_status` — atualiza item (sent/error/skipped), incrementa contadores na execucao
- `execution_status` — retorna status/progresso da execucao atual
- `pause_execution` / `resume_execution` / `stop_execution` — controle de estado
- `list_executions` — historico

Protecoes:
- Lock otimista: ao buscar next_item, usa UPDATE ... WHERE delivery_status = 'pending' LIMIT 1 RETURNING para evitar duplicidade
- Valida que nao ha outro agente processando (verifica execution status)

### Etapa 3 — Painel de Execucao no ENAZIZI

Refatorar `WhatsAppPanel.tsx` adicionando abas ou secoes:

**Aba "Mensagens"** (existente, sem mudanca)

**Aba "Execucao Desktop"** (nova):
- Resumo: total, pendentes, enviados, erros, pulados, barra de progresso, tempo decorrido
- Botoes: Iniciar Execucao Desktop, Pausar, Continuar, Parar, Reprocessar Erros
- Lista de itens com: nome, telefone, status (badge colorido), tentativas, ultimo erro, horario envio
- Clique no item abre dialog com mensagem completa, historico de tentativas

**Aba "Historico"** (nova):
- Lista de execucoes anteriores com data, admin, totais, duracao, status
- Polling a cada 5s durante execucao ativa para atualizar progresso em tempo real

### Etapa 4 — Agente Local Windows (Python)

Script Python entregue em `/mnt/documents/enazizi-whatsapp-agent/` com:

**Arquivos:**
- `agent.py` — script principal com GUI (tkinter)
- `config.json` — configuracoes
- `requirements.txt` — dependencias (requests, pyautogui, pyperclip)
- `README.md` — instrucoes de instalacao

**Fluxo do agente:**
1. Login: email/senha → `POST /auth/v1/token?grant_type=password` → JWT
2. Iniciar execucao: `POST /whatsapp-queue` action=start_execution
3. Loop:
   - GET next_item
   - Se nenhum → fim
   - Abre `whatsapp://send?phone={tel}` via `os.startfile()` (abre WhatsApp Desktop)
   - Aguarda 3s para app abrir
   - `pyperclip.copy(mensagem)` + `pyautogui.hotkey('ctrl', 'v')` para colar
   - `pyautogui.press('enter')` para enviar
   - POST update_status → sent
   - Delay configuravel (8-15s)
4. Em caso de erro: POST update_status → error, segue para proximo

**GUI (tkinter):**
- Status de conexao
- Destinatario atual + preview mensagem
- Progresso (barra + contadores)
- Botoes: Iniciar, Pausar, Continuar, Parar, Pular

**Configuracoes (`config.json`):**
```json
{
  "enazizi_url": "https://qszsyskumcmuknumwxtk.supabase.co",
  "email": "",
  "password": "",
  "delay_min_seconds": 8,
  "delay_max_seconds": 15,
  "max_attempts": 3,
  "pause_on_error": false,
  "whatsapp_load_seconds": 3
}
```

**Resiliencia:**
- Salva execution_id em arquivo local para retomada
- Catch em cada item — erro nao trava a fila

### Etapa 5 — Integracao Final

- WhatsAppPanel detecta execucao ativa e mostra progresso em tempo real (polling 5s)
- Agente e painel compartilham estado via banco de dados
- Logs de auditoria registrados em `whatsapp_execution_logs`

## Arquivos Criados/Alterados

| Arquivo | Acao |
|---------|------|
| Migration SQL | Expandir whatsapp_message_log + criar 2 tabelas |
| `supabase/functions/whatsapp-queue/index.ts` | Nova Edge Function — API da fila |
| `src/components/admin/WhatsAppPanel.tsx` | Adicionar abas Execucao Desktop + Historico |
| `/mnt/documents/enazizi-whatsapp-agent/agent.py` | Agente Python com GUI |
| `/mnt/documents/enazizi-whatsapp-agent/config.json` | Configuracoes |
| `/mnt/documents/enazizi-whatsapp-agent/requirements.txt` | Dependencias |
| `/mnt/documents/enazizi-whatsapp-agent/README.md` | Instrucoes |

## O que NAO muda

- Edge Function `whatsapp-agent` (geracao de mensagens por IA)
- Logica de mood, estilos, anti-repeticao
- Autenticacao/RLS existente
- Fluxo manual wa.me e envio via extensao Chrome (mantidos como opcoes)

