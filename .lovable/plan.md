

# Plano: Alerta de Instalação PWA + Sistema de Mensagens Admin↔Aluno

## 1. Alerta de Instalação PWA no Dashboard

Criar componente `InstallAppBanner.tsx` exibido no Dashboard para usuários que acessam pelo navegador mobile (não PWA):

- Detecta `display-mode: standalone` — se já instalado, não mostra
- Detecta iOS vs Android e mostra instruções específicas
- Botão "Instalar" (Android com `beforeinstallprompt`) ou instruções visuais (iOS: Compartilhar → Adicionar à Tela)
- Dismissível com localStorage (reaparece após 7 dias)
- Aparece logo após o `MotivationalGreeting` no Dashboard

## 2. Sistema de Mensagens Admin → Aluno (In-App)

### Migração SQL

```sql
CREATE TABLE public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,          -- admin que enviou
  recipient_id uuid,                -- NULL = broadcast para todos
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'normal',   -- normal | important | urgent
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.admin_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES admin_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);
```

RLS: admin pode INSERT/SELECT em `admin_messages`; aluno pode SELECT mensagens onde `recipient_id = auth.uid()` ou `recipient_id IS NULL`, e INSERT em `admin_message_reads`.

### Painel Admin — Nova aba "Mensagens"

Em `Admin.tsx`, adicionar tab "✉️ Mensagens":
- Formulário: título, conteúdo (textarea), prioridade (select), destinatário (select: todos / aluno específico)
- Lista de mensagens enviadas com contagem de leituras
- Filtro por prioridade

### Dashboard do Aluno — Inbox de Mensagens

Criar `AdminMessagesBanner.tsx`:
- Consulta mensagens não lidas (broadcast + diretas)
- Mostra badge com contagem no Dashboard
- Clique abre Dialog com lista de mensagens
- Marca como lida ao abrir
- Mensagens urgentes aparecem como Alert no topo

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | 2 tabelas + RLS |
| `src/components/dashboard/InstallAppBanner.tsx` | **Novo** — alerta PWA |
| `src/components/dashboard/AdminMessagesBanner.tsx` | **Novo** — inbox do aluno |
| `src/components/admin/AdminMessagesPanel.tsx` | **Novo** — painel de envio |
| `src/pages/Dashboard.tsx` | Adicionar InstallAppBanner + AdminMessagesBanner |
| `src/pages/Admin.tsx` | Nova aba "Mensagens" |

