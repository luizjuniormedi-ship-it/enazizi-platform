

# Plano: Corrigir botão "Gerar Questões" na aba Uploads

## Problema
O `populate-questions` usa `supabaseAdmin.auth.getUser(token)` para validar o JWT do admin (linha 226). Este é o mesmo problema que afetou o `admin-actions` — o sistema de signing-keys impede que `getUser()` funcione corretamente em edge functions, retornando 401 silenciosamente.

Quando o admin clica em "Gerar Questões", a função retorna 401 e o frontend mostra erro genérico.

## Solução

### Editar `supabase/functions/populate-questions/index.ts`
Aplicar o mesmo fix do `admin-actions`: usar um client com `SUPABASE_ANON_KEY` + o header Authorization do request para validar o usuário, em vez de `supabaseAdmin.auth.getUser(token)`.

```text
// Antes (quebrado):
const { data: { user } } = await supabaseAdmin.auth.getUser(token);

// Depois (funciona):
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const userClient = createClient(supabaseUrl, anonKey, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user } } = await userClient.auth.getUser();
```

- Manter o `supabaseAdmin` (service role) para operações de banco
- Usar `userClient` (anon key + auth header) apenas para identificar o usuário
- Manter a lógica de fallback para service_role_key token

### Deploy
- Redeployar a edge function `populate-questions`

## Arquivo
- Editar + deploy: `supabase/functions/populate-questions/index.ts`

