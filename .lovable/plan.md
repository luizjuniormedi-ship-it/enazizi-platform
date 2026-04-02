

# Enviar BI Diário a Todos os Alunos (exceto opt-out)

## Problema
A função `daily-bi-whatsapp` (linha 25) filtra apenas usuários com `whatsapp_daily_bi = true`. Isso exige que o aluno ative manualmente o recebimento. O comportamento correto é: **todos recebem por padrão**, exceto quem digitou SAIR (`whatsapp_opt_out = true`).

## Solução
Remover o filtro `.eq("whatsapp_daily_bi", true)` da query de seleção de usuários. Manter apenas:
- `whatsapp_opt_out = false`
- `phone IS NOT NULL` e `phone != ''`

### Mudança em `supabase/functions/daily-bi-whatsapp/index.ts`

**Linha 25** — Remover:
```typescript
.eq("whatsapp_daily_bi", true)
```

A query ficará:
```typescript
const { data: users, error: usersErr } = await supabase
  .from("profiles")
  .select("user_id, display_name, phone")
  .eq("whatsapp_opt_out", false)
  .not("phone", "is", null)
  .neq("phone", "");
```

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/daily-bi-whatsapp/index.ts` | Remover filtro `whatsapp_daily_bi = true` |

