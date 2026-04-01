

# Atualização Completa do Sistema ENAZIZI

## 1. Bug Crítico: "Token inválido" no Painel Professor

**Causa raiz confirmada**: Os auth logs mostram `"Session not found"` / `"session id doesn't exist"` retornado com status 403. Isso acontece porque:
- O `useAuth.tsx` faz `window.location.reload()` imediatamente após login (SIGNED_IN)
- Durante o reload, o token antigo pode ser usado antes da nova sessão estar pronta
- O `professor-simulado` usa `sb.auth.getUser(token)` com service role client, que internamente chama `/user` e recebe 403

**Correção (2 partes)**:

### 1a. Edge function `professor-simulado/index.ts` — Usar `getClaims()` em vez de `getUser()`
Substituir a autenticação por `getClaims(token)` que valida o JWT localmente sem depender do endpoint `/user`:

```typescript
const token = authHeader.replace("Bearer ", "");
const { data, error: authError } = await sb.auth.getClaims(token);
if (authError || !data?.claims) {
  return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, ... });
}
const userId = data.claims.sub;
```

Depois usar `userId` para buscar roles e perfil.

### 1b. `useAuth.tsx` — Remover reload agressivo após login
O `clearAndReload()` causa o problema de timing. Remover o `window.location.reload()` automático no SIGNED_IN — o React Query e state management já atualizam a UI sem precisar de reload.

## 2. Gerador Bulk — JSON parse ainda falhando

Os logs mostram que Parasitologia gerou 60.450 chars com ````json` wrapping que quebra o parse. O `bulk-generate-content` já tem strip de markdown, mas o conteúdo pode ter markdown interno. Reforçar a limpeza do JSON antes do parse.

## 3. Publicação Frontend

Após as correções, o frontend será automaticamente atualizado no preview. Para publicar no domínio `.lovable.app`, basta clicar **Publish → Update**.

## 4. Mobile (Capacitor)

O `capacitor.config.ts` já está configurado com hot-reload. O app mobile carrega do servidor Lovable automaticamente — qualquer mudança no código se reflete no app. Para gerar builds nativos:
1. Exportar para GitHub
2. `git pull && npm install && npm run build && npx cap sync`
3. `npx cap run ios` ou `npx cap run android`

## 5. Dependências

As dependências estão atualizadas (React 18.3, Vite 5.4, Supabase JS 2.95). Sem atualizações críticas.

## Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/professor-simulado/index.ts` | `getClaims()` em vez de `getUser()` |
| `src/hooks/useAuth.tsx` | Remover reload forçado no login |
| `supabase/functions/bulk-generate-content/index.ts` | Melhorar limpeza de JSON |

## Resultado

- Painel professor carrega sem erro 401
- Login não causa reload desnecessário
- Geração bulk mais robusta contra falhas de parse
- Sistema pronto para publicação web e mobile

