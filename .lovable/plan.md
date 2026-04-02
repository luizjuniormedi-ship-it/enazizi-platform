

# Fix: Estatísticas Zeradas na Página de Login

## Problema
As contagens (Alunos, Questões, Flashcards) mostram "0+" porque a página de login não tem sessão autenticada. As tabelas `profiles`, `questions_bank` e `flashcards` têm RLS que bloqueia leitura por usuários anônimos — o Supabase retorna `count = 0`.

## Solução
Criar uma função SQL `SECURITY DEFINER` que retorna as contagens sem depender de RLS, acessível por `anon` e `authenticated`.

### 1. Migração SQL — Função `get_login_stats()`
```sql
CREATE OR REPLACE FUNCTION public.get_login_stats()
RETURNS TABLE (alunos bigint, questoes bigint, flashcards bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM profiles WHERE user_type = 'estudante'),
    (SELECT (SELECT count(*) FROM questions_bank) + (SELECT count(*) FROM real_exam_questions WHERE is_active = true)),
    (SELECT count(*) FROM flashcards);
$$;

GRANT EXECUTE ON FUNCTION public.get_login_stats() TO anon, authenticated;
```

### 2. `src/pages/Login.tsx` — Chamar a RPC
Substituir as 4 queries paralelas por uma única chamada:
```typescript
const { data } = await supabase.rpc("get_login_stats").maybeSingle();
if (data) {
  setDynamicStats({
    alunos: formatCount(data.alunos),
    questoes: formatCount(data.questoes),
    flashcards: formatCount(data.flashcards),
  });
}
```

## Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Criar função `get_login_stats()` com SECURITY DEFINER |
| `src/pages/Login.tsx` | Trocar queries diretas por `supabase.rpc("get_login_stats")` |

