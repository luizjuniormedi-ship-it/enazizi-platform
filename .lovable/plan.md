
# Redirecionar para https://enazizi.com + Corrigir Build

## Contexto

O domínio publicado atual é `enazizi-com-br.lovable.app`. O usuário quer que ao acessar a plataforma, o aluno seja direcionado para `https://enazizi.com`.

Há também um erro de build que precisa ser corrigido antes de qualquer atualização.

## Mudanças

### 1. Corrigir erro de build

O build falhou provavelmente por um problema residual. Preciso verificar e corrigir qualquer erro de compilação TypeScript no frontend (os edge functions com `getClaims` não afetam o build do frontend).

### 2. Configurar domínio customizado `enazizi.com`

Para que `enazizi.com` funcione, você precisa:

1. **No seu registrador de domínio** (onde comprou `enazizi.com`), configurar:
   - **Registro A** — Nome: `@` → Valor: `185.158.133.1`
   - **Registro A** — Nome: `www` → Valor: `185.158.133.1`
   - **Registro TXT** — Nome: `_lovable` → Valor: será fornecido pelo Lovable ao conectar

2. **No Lovable**: Ir em **Project Settings → Domains → Connect Domain** e adicionar `enazizi.com` e `www.enazizi.com`

3. Aguardar propagação DNS (até 72h) e SSL automático

### 3. Redirect no código — Forçar domínio canônico

Adicionar redirect no `src/main.tsx` para que qualquer acesso via `enazizi-com-br.lovable.app` ou outro domínio seja redirecionado para `https://enazizi.com`:

```typescript
// Redirect to canonical domain in production
const canonical = "enazizi.com";
if (
  window.location.hostname !== canonical &&
  window.location.hostname !== `www.${canonical}` &&
  !window.location.hostname.includes("localhost") &&
  !window.location.hostname.includes("id-preview--") &&
  !window.location.hostname.includes("lovableproject.com")
) {
  window.location.replace(`https://${canonical}${window.location.pathname}${window.location.search}`);
}
```

### 4. Atualizar Capacitor config

Em `capacitor.config.ts`, mudar a URL do servidor de `lovableproject.com` para `https://enazizi.com`:

```typescript
server: {
  url: "https://enazizi.com?forceHideBadge=true",
  cleartext: true,
},
```

### 5. Atualizar meta tags e OG

Em `index.html`, atualizar `og:url` e canonical se necessário.

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/main.tsx` | Redirect canônico para enazizi.com |
| `capacitor.config.ts` | URL do servidor → enazizi.com |
| `index.html` | Meta tags com domínio correto |

## Pré-requisito do usuário

Configurar os registros DNS no registrador do domínio `enazizi.com` apontando para `185.158.133.1` e conectar o domínio em **Project Settings → Domains**.
