

# Fix: Messages Not Appearing in Desktop Execution

## Root Cause

The flow is broken between message generation and desktop execution:

1. **"Gerar mensagens"** calls `whatsapp-agent` → generates AI messages → returns them to the UI only (stored in React state `students[]`)
2. **"Iniciar Execução"** calls `whatsapp-queue?action=start_execution` → looks for `pending` rows in `whatsapp_message_log` table → finds **0 items** because nothing was inserted

The messages only exist in the browser's memory, not in the database queue.

## Fix

After generating messages successfully, automatically insert them into `whatsapp_message_log` with `delivery_status: 'pending'`, then start the desktop execution. This connects the two flows.

### Changes to `src/components/admin/WhatsAppPanel.tsx`

1. **After `generateMessages` succeeds**, insert all generated students into `whatsapp_message_log` as pending items:

```typescript
// After setStudents(data.students) succeeds:
const user = (await supabase.auth.getUser()).data.user;
if (user && data.students?.length > 0) {
  const rows = data.students
    .filter(s => !s.already_sent_today && s.phone)
    .map(s => ({
      admin_user_id: user.id,
      target_user_id: s.user_id,
      message_text: s.message,
      delivery_status: 'pending',
      execution_mode: 'desktop',
    }));
  await supabase.from("whatsapp_message_log").insert(rows);
}
```

2. **After inserting**, automatically call `handleStartDesktopExecution()` and switch to the "desktop" tab so the user sees the queue populated and ready.

3. **Add a toast** indicating messages were queued for desktop execution.

### Result
- Click "Gerar mensagens" → messages are created by AI AND saved to the queue
- Desktop execution tab shows all items with their status
- The Python agent (`agent.py`) can poll and find pending items to send via WhatsApp Desktop

## Files Changed
| File | Change |
|------|--------|
| `src/components/admin/WhatsAppPanel.tsx` | Insert generated messages into `whatsapp_message_log` after generation, auto-start execution, switch to desktop tab |

