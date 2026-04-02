

# Fix: WhatsApp Queue 401 + Blank Screen

## Problem
1. The password was changed, which invalidated the current session (session ID `335781c2...` no longer exists)
2. The `callQueue` function in `WhatsAppPanel.tsx` doesn't handle 401 responses — it calls `resp.json()` which parses `{"error":"Unauthorized"}` but the error bubbles up and causes a blank screen
3. The user needs to **log out and log back in** to get a fresh session token

## Fix (2 parts)

### 1. Handle 401 in `callQueue` (WhatsAppPanel.tsx ~line 270-278)
- Check `resp.status === 401` before parsing JSON
- If 401, call `supabase.auth.signOut()` and redirect to `/login`
- Show a toast explaining the session expired

```typescript
const callQueue = async (action: string, body: any = {}) => {
  if (!session) return null;
  const resp = await fetch(`...whatsapp-queue?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  if (resp.status === 401) {
    toast({ title: "Sessão expirada", description: "Faça login novamente.", variant: "destructive" });
    await supabase.auth.signOut();
    window.location.assign("/login");
    return null;
  }
  return resp.json();
};
```

### 2. Immediate fix for the user
- After deploying the code change, the user must **log out** from the app and **log back in** with the new password (`07114575`) to get a valid session token

## Files changed
| File | Change |
|------|--------|
| `src/components/admin/WhatsAppPanel.tsx` | Add 401 handling in `callQueue` with signOut + redirect |

