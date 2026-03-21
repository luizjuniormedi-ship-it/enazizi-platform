

## Plano: Cadastro obrigatório completo + universidades de todo o Brasil

### Problema atual
1. Usuários com status "pending" veem a tela de "aguardando aprovação" **sem completar o cadastro** — o admin aprova sem saber faculdade/telefone
2. A lista de universidades tem apenas ~20 do Rio de Janeiro

### Mudanças

**1. Forçar onboarding ANTES da tela de aprovação**

No `ProtectedRoute.tsx`, mover o check de `profileIncomplete` para **antes** do check de `profileStatus === "pending"`. Assim, qualquer usuário (pending, active, etc.) precisa completar o cadastro primeiro.

**2. Expandir lista de universidades para todo o Brasil**

Atualizar `src/constants/faculdades.ts` com as principais siglas de universidades federais, estaduais e privadas do Brasil (~120 instituições), organizadas alfabeticamente, com "Outra" por último. Incluir:
- Federais: UFRJ, USP, UNICAMP, UFMG, UFRGS, UFBA, UFC, UFPE, UFPR, UFSC, UnB, UFES, UFPA, UFSM, UFG, etc.
- Estaduais: UERJ, UNESP, UEPA, UECE, UEL, UEM, UEZO, etc.
- Privadas: PUC (Rio, SP, MG, PR, RS), Estácio, UniRedentor, Unigranrio, Einstein, Sírio-Libanês, Santo Amaro, Anhembi Morumbi, etc.

**3. Adicionar busca/filtro no select de faculdade**

Com ~120 opções, trocar o `Select` por um componente com campo de busca (usando `Command`/Combobox do shadcn) tanto no onboarding quanto no perfil, para facilitar a seleção.

### Arquivos afetados
- `src/constants/faculdades.ts` — lista expandida
- `src/components/auth/ProtectedRoute.tsx` — reordenar checks (incomplete antes de pending)
- `src/pages/Profile.tsx` — componente de busca no select de faculdade

### Sem mudanças no banco de dados
O campo `faculdade` é texto livre, aceita qualquer valor.

