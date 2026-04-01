

# Fix: Botão Equalizar retorna 401

## Causa raiz

A edge function `bulk-generate-content` **não está no `supabase/config.toml`**, então `verify_jwt` está em `true` por padrão. O Supabase gateway rejeita a requisição antes mesmo do código ser executado — por isso não há logs de erro na function.

## Correção

### 1. `supabase/config.toml` — Adicionar entrada para bulk-generate-content

```toml
[functions.bulk-generate-content]
verify_jwt = false
```

Isso permite que a function receba a requisição e faça a validação manual do token (que já existe no código nas linhas 277-302).

### 2. Re-deploy da function

Após a mudança no config.toml, a function será re-deployada automaticamente com a nova configuração.

## Resultado

O botão "Equalizar Banco" passará a funcionar — a requisição chegará ao código da function, que valida o token e verifica se o usuário é admin antes de processar.

