

# Corrigir Horário do Cron do BI Diário WhatsApp (20h → 18h BRT)

## Problema
O cron job `daily-bi-whatsapp-20h` está agendado para `0 23 * * *` (23:00 UTC = **20:00 BRT**), mas deveria disparar às **18:00 BRT** (21:00 UTC).

Além disso, a função nunca executou (sem logs), possivelmente porque foi deployada depois do último horário agendado.

## Solução

1. **Remover o cron antigo** (`daily-bi-whatsapp-20h`)
2. **Criar novo cron** com schedule `0 21 * * *` (21:00 UTC = 18:00 BRT) e nome `daily-bi-whatsapp-18h`
3. **Testar a edge function** manualmente para garantir que funciona

## Detalhes Técnicos

Executar via SQL:
```sql
SELECT cron.unschedule('daily-bi-whatsapp-20h');

SELECT cron.schedule(
  'daily-bi-whatsapp-18h',
  '0 21 * * *',
  $$
  SELECT net.http_post(
    url:='https://qszsyskumcmuknumwxtk.supabase.co/functions/v1/daily-bi-whatsapp',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <anon_key>"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

Depois, invocar a função manualmente para validar.

| Ação | Detalhe |
|------|---------|
| Remover cron antigo | `daily-bi-whatsapp-20h` (23h UTC / 20h BRT) |
| Criar cron novo | `daily-bi-whatsapp-18h` (21h UTC / 18h BRT) |
| Testar função | Invocar manualmente e verificar logs |

