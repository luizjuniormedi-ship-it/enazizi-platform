

# Correção: Forçar recadastramento de usuários sem nome

## Problema Identificado

No `ProtectedRoute.tsx`, a query na linha 48 **não inclui `user_type`** no SELECT:

```text
.select("is_blocked, status, display_name, phone, periodo, faculdade, onboarding_version")
         ^^^^^^^^ user_type ESTÁ FALTANDO
```

Consequência: `(data as any)?.user_type` sempre retorna `undefined`, o sistema assume `"estudante"` para todos. Isso causa dois problemas:
- Médicos são forçados a preencher período/faculdade (que não precisam)
- A lógica de completude não reflete o tipo real do usuário

Além disso, a validação `isValidName` aceita nomes com 2 palavras curtas (ex: "ab cd") — mas o principal gap é que o `user_type` errado distorce toda a validação.

## Correção (1 arquivo)

### `src/components/auth/ProtectedRoute.tsx`

1. **Adicionar `user_type` ao SELECT** (linha 48):
```typescript
.select("is_blocked, status, display_name, phone, periodo, faculdade, onboarding_version, user_type")
```

2. **Remover cast `as any`** (linha 57):
```typescript
const userType = data?.user_type || "estudante";
```

Isso garante que:
- Estudantes sem nome/telefone/período/faculdade → tela de recadastramento
- Médicos sem nome/telefone → tela de recadastramento (sem exigir período/faculdade)
- Nenhum usuário incompleto passa despercebido

## Impacto

- Zero mudança em rotas, business logic ou fluxo
- Apenas corrige a query para incluir o campo que já deveria estar lá
- Todos os usuários logados terão perfil revalidado no próximo acesso

