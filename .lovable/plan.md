

# Fix: Zero Items in Desktop Execution Queue

## Root Cause

There are **two bugs** working together:

1. **`whatsapp-agent` counts cancelled messages as "already sent"**: The edge function queries `whatsapp_message_log` filtering only by `sent_at >= today` but does NOT filter by `delivery_status = 'sent'`. The 56 cancelled messages from earlier today have `sent_at` set (because the column defaults to `now()`), so ALL students appear as `already_sent_today: true`.

2. **Client-side filter blocks insert**: In `WhatsAppPanel.tsx`, the insert code filters with `!s.already_sent_today`, so when every student is marked as already sent, zero rows get inserted into the queue.

## Fix

### 1. Edge Function: `supabase/functions/whatsapp-agent/index.ts` (~line 61-65)

Add `.eq("delivery_status", "sent")` to the today-logs query so only actually sent messages count:

```typescript
const { data: todayLogs } = await supabaseAdmin
  .from("whatsapp_message_log")
  .select("target_user_id, message_text")
  .gte("sent_at", `${today}T00:00:00Z`)
  .eq("delivery_status", "sent")          // ← ADD THIS
  .in("target_user_id", userIds);
```

This ensures cancelled, pending, or errored messages don't block re-generation.

### 2. Clean up stale data (one-time migration)

Reset the 56 cancelled rows' `sent_at` to NULL so they don't interfere if the filter is ever loosened:

```sql
UPDATE whatsapp_message_log SET sent_at = NULL WHERE delivery_status = 'cancelled';
```

## Result

- "Gerar mensagens" → students no longer marked as `already_sent_today` (since none were actually sent)
- Messages get inserted as `pending` into the queue
- "Iniciar Execução" finds the pending rows and creates the execution with the correct item count

## Files Changed
| File | Change |
|------|--------|
| `supabase/functions/whatsapp-agent/index.ts` | Add `delivery_status = 'sent'` filter to today-logs query |
| Migration (data fix) | Set `sent_at = NULL` on cancelled messages |

