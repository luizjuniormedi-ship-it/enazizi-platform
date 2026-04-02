

# Fix: WhatsApp Message Links Showing Wrong URL

## Problem
Two places send the wrong link in WhatsApp messages:

1. **`src/components/admin/WhatsAppPanel.tsx` (line 181)**: Sends `window.location.origin` as `app_url`, which in preview is `https://87c4855c-...lovableproject.com`
2. **`supabase/functions/whatsapp-auto-send/index.ts` (line 167)**: Hardcoded `https://enazizi-com-br.lovable.app` instead of canonical domain

## Fix

### 1. `src/components/admin/WhatsAppPanel.tsx`
Replace `window.location.origin` with the canonical domain:
```typescript
body: JSON.stringify({ app_url: "https://enazizi.com" }),
```

### 2. `supabase/functions/whatsapp-auto-send/index.ts`
Replace the hardcoded lovable.app URL:
```
Link: https://enazizi.com
```

## Files Changed
| File | Change |
|------|--------|
| `src/components/admin/WhatsAppPanel.tsx` | Hardcode `https://enazizi.com` as `app_url` |
| `supabase/functions/whatsapp-auto-send/index.ts` | Update link from `enazizi-com-br.lovable.app` to `enazizi.com` |

