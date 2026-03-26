

# Plano: Correcao de Falhas de Seguranca

A analise de seguranca encontrou **9 vulnerabilidades** (4 criticas, 5 avisos). Abaixo as correcoes priorizadas.

## Vulnerabilidades Criticas

### 1. Escalacao de privilegios — `user_roles`
**Problema**: A politica "Admins can manage roles" usa `has_role()` que depende da propria tabela. Se a tabela estiver vazia, ninguem e admin, mas tambem nao ha INSERT restrito — o `handle_new_user()` insere com `SECURITY DEFINER`, porem nao ha politica bloqueando INSERT manual por usuarios autenticados.

**Correcao**: Adicionar politica explicita bloqueando INSERT/UPDATE/DELETE para nao-admins, e restringir INSERT a `service_role` apenas.

### 2. Dados sensiveis expostos — `profiles`
**Problema**: Qualquer usuario autenticado pode potencialmente ler emails e telefones de outros usuarios via queries indiretas.

**Correcao**: Manter SELECT restrito a `user_id = auth.uid()` e admins. Remover paths de leitura via organizacao.

### 3. Uploads privados expostos — `uploads`
**Problema**: Politica "All authenticated can read uploads" com `USING(true)` expoe todos os uploads.

**Correcao**: Alterar para `(user_id = auth.uid()) OR (is_global = true)`.

### 4. Flashcards e Summaries privados expostos
**Problema**: Politicas com `USING(true)` expoem conteudo de todos os usuarios.

**Correcao**: Alterar para `(user_id = auth.uid()) OR (is_global = true)`.

## Vulnerabilidades de Aviso

### 5. Leaked Password Protection desabilitada
**Correcao**: Ativar via configuracao de autenticacao.

### 6. `chat_conversations` com role `public`
**Correcao**: Alterar politica de `public` para `authenticated`.

### 7. `user_gamification` expoe todos os campos
**Correcao**: Aceitavel para ranking — manter, pois nao contem dados sensiveis alem de padroes de atividade.

### 8. `clinical_cases` com `USING(true)`
**Correcao**: Alterar para `(user_id = auth.uid()) OR (is_global = true)`.

## Migracoes SQL necessarias

Uma unica migracao com:
1. DROP + CREATE das politicas SELECT de `uploads`, `flashcards`, `summaries`, `clinical_cases` para filtrar por `is_global` ou owner
2. DROP + CREATE da politica de `chat_conversations` mudando role de `public` para `authenticated`
3. Adicionar politica explicita em `user_roles` restringindo INSERT apenas a `service_role`
4. Ativar leaked password protection

## Impacto no codigo
- Nenhuma mudanca de codigo frontend necessaria — a logica de compartilhamento global ja usa `is_global: true` nos inserts
- O ranking (`MiniLeaderboard`) continua funcionando pois `user_gamification` mantem leitura aberta

## Arquivos
- Migracao SQL (via ferramenta de banco)
- Configuracao de auth (leaked password protection)

