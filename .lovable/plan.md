

# Plano: Verificação Diária Automática de Saúde do Sistema

## Objetivo
Criar uma Edge Function que roda diariamente via cron job, verifica problemas críticos da plataforma, salva os resultados numa tabela, e exibe um popup para o admin no Dashboard com os alertas detectados.

## Arquitetura

```text
pg_cron (diário 6h) → Edge Function "system-health-check"
                            ↓
                    Consulta tabelas do sistema
                            ↓
                    Salva em "system_health_reports"
                            ↓
            Admin abre Dashboard → popup com alertas
```

## Verificações Automáticas

| Check | Fonte | Severidade |
|-------|-------|------------|
| Questões no banco < 100 por especialidade | `questions_bank` | Crítico |
| Geração diária falhou (últimas 24h) | `daily_generation_log` | Crítico |
| Edge Functions com timeout/erro | Logs da AI (ai-fetch errors) | Crítico |
| Uploads pendentes > 24h | `uploads` where status='pending' | Aviso |
| Usuários com cota esgotada (>80%) | `user_quotas` | Aviso |
| Feedbacks não lidos (últimos 7 dias) | `user_feedback` | Info |
| Usuários pendentes de aprovação | `profiles` where status='pending' | Aviso |
| Flashcards sem revisão (banco estagnado) | `reviews` | Info |

## Mudanças

### 1. Nova tabela `system_health_reports`
- `id`, `check_date` (date), `alerts` (jsonb array), `total_critical`, `total_warning`, `total_info`, `created_at`
- RLS: apenas admins podem ler

### 2. Nova Edge Function `system-health-check`
- Consulta todas as tabelas relevantes usando service_role
- Gera array de alertas com severidade, título, descrição, dados numéricos
- Insere na tabela `system_health_reports`
- Chamada via pg_cron diariamente às 6h

### 3. Novo componente `AdminSystemAlerts.tsx`
- Consulta `system_health_reports` mais recente
- Exibe popup/dialog ao admin no Dashboard
- Cards coloridos por severidade (vermelho/amarelo/azul)
- Botão "Dispensar" com localStorage
- Botão "Ver detalhes" que abre o painel Admin

### 4. Integração no Dashboard
- Importar `AdminSystemAlerts` no `Dashboard.tsx`
- Renderizar apenas para admins (usa `useAdminCheck`)

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/...` | Criar tabela `system_health_reports` |
| `supabase/functions/system-health-check/index.ts` | **Novo** — Edge Function de verificação |
| `src/components/admin/AdminSystemAlerts.tsx` | **Novo** — popup de alertas |
| `src/pages/Dashboard.tsx` | Integrar popup |

## Detalhes Técnicos
- pg_cron + pg_net para agendar chamada diária à Edge Function
- Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` para queries sem RLS
- Alertas armazenados como JSONB: `[{id, severity, title, message, metric, threshold}]`
- Frontend filtra alertas por severidade e mostra badge com contagem no ícone de sino

