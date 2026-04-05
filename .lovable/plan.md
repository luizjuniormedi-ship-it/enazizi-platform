

# Plano: Corrigir Redirect Pós-Login para MissionEntry

## Problema
O redirect para `/mission` falha porque:
1. A chave `sessionStorage("enazizi_mission_entry_seen")` é setada na primeira visita ao Dashboard — mesmo que o usuário navegue para lá sem ter logado, a chave já existe
2. O redirect acontece **dentro** do Dashboard, causando flash visual do Dashboard antes do redirect
3. Se o usuário recarrega a aba, o `sessionStorage` já tem a chave e nunca mais redireciona

## Solução

### 1. Mover redirect para o `AuthProvider` (ou componente dedicado)
Em vez de redirecionar dentro do Dashboard, interceptar no evento `SIGNED_IN` do `onAuthStateChange`:
- No `useAuth.tsx`, quando `event === "SIGNED_IN"` e a flag estiver ativa, setar uma flag temporária (ex: `localStorage("enazizi_should_redirect_mission") = "true"`)
- Isso garante que o redirect é disparado **por login**, não por visita ao Dashboard

### 2. Criar componente `MissionRedirectGuard` no App.tsx
Componente leve dentro das rotas protegidas que:
- Checa se `localStorage` tem `enazizi_should_redirect_mission`
- Se sim, remove a chave e redireciona para `/mission`
- Se não, renderiza normalmente
- Isso elimina o flash do Dashboard

### 3. Remover lógica de redirect do Dashboard.tsx
- Deletar o `useEffect` das linhas 96-103
- O Dashboard volta a ser apenas Dashboard, sem lógica de gate

### 4. Alternativa mais simples (recomendada)
Manter a lógica no Dashboard mas trocar `sessionStorage` por `localStorage` com timestamp do login:
- No `SIGNED_IN` do auth, gravar `localStorage("enazizi_last_login_ts") = Date.now()`
- No Dashboard, comparar: se `last_login_ts` foi há menos de 10 segundos E flag ON E não tem `enazizi_mission_seen_<ts>` → redirecionar
- Isso garante que só redireciona no login fresco, não em recargas

## Arquivos a alterar
1. **`src/hooks/useAuth.tsx`** — gravar timestamp de login no `SIGNED_IN`
2. **`src/pages/Dashboard.tsx`** — trocar lógica de `sessionStorage` para checar timestamp recente

## O que NÃO muda
- MissionEntry.tsx, rotas, feature flags, Study Engine

