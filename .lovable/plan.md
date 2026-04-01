

# Equalização Automática de Questões via Cron Job

## Objetivo

Criar um job agendado (pg_cron) que executa a equalização automaticamente toda noite. Quando há discrepância entre especialidades, o sistema gera questões sem intervenção manual.

## Mudanças

### 1. Permitir chamada com service_role key (já funciona)

O `bulk-generate-content` já aceita `service_role_key` como token (linhas 345-348). O cron job usará isso.

### 2. Criar cron job via SQL insert

Agendar `pg_cron` para chamar `bulk-generate-content` com `{ "equalize": true, "batchSize": 15, "maxSpecialties": 3 }` diariamente às 3h da manhã. Processar 3 especialidades por execução para evitar timeout.

```sql
select cron.schedule(
  'auto-equalize-questions',
  '0 3 * * *',
  $$
  select net.http_post(
    url:='https://qszsyskumcmuknumwxtk.supabase.co/functions/v1/bulk-generate-content',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer SERVICE_ROLE_KEY"}'::jsonb,
    body:='{"equalize":true,"batchSize":15,"maxSpecialties":3}'::jsonb
  ) as request_id;
  $$
);
```

### 3. Habilitar extensões `pg_cron` e `pg_net`

Necessárias para o agendamento funcionar.

### 4. Log de execução

A function já registra resultados no console. Adicionalmente, inserir um registro na tabela `daily_generation_log` ao final de cada execução automática para rastreabilidade no painel admin.

### 5. Atualizar `bulk-generate-content` — log automático

Adicionar no final do bloco equalize: inserir na `daily_generation_log` com `status`, `questions_generated`, `specialties_processed`.

### 6. Painel Admin — indicador de "Equalização Automática"

Adicionar badge no `AdminIngestionPanel` mostrando que a equalização roda automaticamente às 3h, com link para ver o último log.

## Resultado

- Toda noite às 3h, o sistema verifica discrepâncias e gera até ~45 questões (3 especialidades × 15 questões)
- Em ~2 semanas todas as especialidades atingem o alvo sem intervenção manual
- Logs visíveis no painel admin

