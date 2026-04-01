
# Atualização Completa do Sistema

## Bug Crítico: "Token inválido" no Painel do Professor

O erro 401 "Token inválido" ocorre porque o `professor-simulado` edge function usa `sb.auth.getUser(token)` com um client criado com `serviceRoleKey`. Em algumas versões do Supabase JS, o `getUser` com service role key pode ignorar o token passado como argumento e usar o próprio service role token interno.

### Correção: `supabase/functions/professor-simulado/index.ts`

Criar um **segundo client** com a `anon key` + header do usuário para autenticar, em vez de usar o service role client para `getUser`:

```typescript
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const userClient = createClient(supabaseUrl, anonKey, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user }, error: authError } = await userClient.auth.getUser();
```

Manter o `sb` (service role) apenas para operações de dados. Aplicar o mesmo padrão nos outros arquivos que chamam esta edge function (não necessário — é o mesmo endpoint).

## Publicação Frontend (Web)

Após a correção do bug, publicar o site clicando em **Publish → Update**. Nenhuma mudança de código necessária — apenas garantir que o build compila sem erros.

## Preparação Mobile (Capacitor)

O `capacitor.config.ts` já está configurado com hot-reload apontando para o preview. Para gerar builds nativos, o fluxo é:

1. Exportar para GitHub (Settings → GitHub)
2. `git pull` no computador local
3. `npm install && npm run build`
4. `npx cap sync`
5. `npx cap run ios` ou `npx cap run android`

Nenhuma mudança de código necessária — o Capacitor já carrega o app diretamente do servidor Lovable.

## Dependências

As dependências já estão em versões recentes (React 18.3, Vite 5.4, Supabase JS 2.95). Não há atualizações críticas pendentes.

## Resumo de Arquivos Alterados

- `supabase/functions/professor-simulado/index.ts` — Corrigir autenticação usando anon key client para getUser

## Resultado

- Painel professor funciona sem erro 401
- Frontend publicado com últimas mudanças
- Mobile pronto para build via Capacitor
