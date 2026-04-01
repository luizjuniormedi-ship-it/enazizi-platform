

# Validar Faculdade contra Lista Oficial

## Contexto

Há 1 usuário com `faculdade = 'Outra'` (Gabriel Nunes Carretero). Como removemos "Outra" da lista, precisamos que `isProfileComplete` valide se a faculdade está na lista oficial — assim esse usuário (e qualquer outro com valor inválido) será travado na tela de completar cadastro.

## Mudança

| Arquivo | Mudança |
|---------|---------|
| `src/lib/profileValidation.ts` | Importar `FACULDADES` e adicionar verificação: se `faculdade` não está na lista, retornar `false` em `isProfileComplete` |

## Detalhe

Na função `isProfileComplete`, após checar `if (isStudent && (!data.periodo || !data.faculdade))`, adicionar:

```ts
import { FACULDADES } from "@/constants/faculdades";

// Dentro de isProfileComplete:
if (data.faculdade && !FACULDADES.includes(data.faculdade)) return false;
```

Isso faz com que qualquer usuário com "Outra" ou valor fora da lista seja forçado a selecionar uma universidade válida na tela de recadastramento.

