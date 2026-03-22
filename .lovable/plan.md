

# Plano: Geração Automática Diária de 20 Questões por Especialidade

## Problema
Hoje a geração de questões é manual (admin clica um botão). O usuário quer que o sistema gere automaticamente 20 novas questões de cada especialidade todos os dias, alimentando o banco global.

## Solução
Criar uma edge function `daily-question-generator` acionada por um cron job (pg_cron) que roda 1x por dia. A cada execução, ela seleciona 3-4 especialidades (para não estourar timeout) e gera 20 questões de cada. Em ~7 dias, todas as 24 especialidades são cobertas. As questões vão para `questions_bank` com `is_global = true`.

## Mudanças

### 1. Edge Function `supabase/functions/daily-question-generator/index.ts`
- Reutiliza a lógica do `bulk-generate-content` (prompt, parsing, validação anti-conteúdo-proibido)
- Seleciona as 4 especialidades com menos questões globais no banco (balanceamento automático)
- Gera 20 questões por especialidade via `aiFetch` (google/gemini-2.5-flash)
- Busca as últimas 50 questões da especialidade para injetar como contexto anti-repetição
- Insere em `questions_bank` com `is_global = true`, `source = 'daily-auto'`
- Aceita chamada sem JWT (cron job usa anon key)
- Loga resultado: quantas questões geradas por especialidade

### 2. Cron Job via pg_cron (SQL insert, não migration)
- Habilitar extensões `pg_cron` e `pg_net` (migration)
- Agendar job diário às 04:00 UTC que chama a edge function via `net.http_post`
- O job envia `Authorization: Bearer ANON_KEY` no header

### 3. Tabela de controle `daily_generation_log` (migration)
- Registra cada execução: data, especialidades processadas, questões geradas, status
- Permite ao admin ver o histórico de geração automática
- Colunas: `id`, `run_date`, `specialties_processed (jsonb)`, `questions_generated (int)`, `status (text)`, `created_at`
- RLS: apenas admins podem ler

## Fluxo Diário

```text
04:00 UTC ─► pg_cron dispara net.http_post
           ─► daily-question-generator
              ├── Busca 4 especialidades com menos questões
              ├── Para cada: gera 20 questões (anti-repetição)
              ├── Insere em questions_bank (is_global=true)
              └── Loga em daily_generation_log
```

## Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/daily-question-generator/index.ts` | **NOVO** — edge function de geração diária |
| Migração SQL | Criar tabela `daily_generation_log` + habilitar `pg_cron`/`pg_net` |
| SQL insert (não migração) | Criar o cron job schedule |

## Detalhes Técnicos
- 4 especialidades por execução (evita timeout de 60s da edge function)
- 20 questões por especialidade = ~80 questões/dia
- Em ~7 dias cobre todas as 24 especialidades
- Anti-repetição: busca últimas 50 questões da especialidade antes de gerar
- Usa `userId` do primeiro admin encontrado em `user_roles`

