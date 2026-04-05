

# Plano: Corrigir Atualização do Contador de Revisões Atrasadas

## Problema
O card "Você tem 40 revisões atrasadas" no SmartAlertCard nunca atualiza porque:

1. **`useCoreData`** tem `staleTime: 3min` e `refetchOnWindowFocus: false` — os dados das revisões ficam congelados
2. **`useDashboardData`** tem `staleTime: 2min` e `refetchOnWindowFocus: false` — mesmo problema
3. **Snapshot persistente** tem staleness de 10 minutos — na primeira visita, o dado antigo do snapshot é usado
4. Quando o aluno completa revisões, o `invalidateAll()` é chamado, mas se ele volta ao Dashboard sem ter passado por um fluxo que chama `invalidateAll`, o número fica estático

## Solução

### 1. Habilitar `refetchOnWindowFocus` nos hooks críticos
Quando o aluno sai da missão/revisão e volta ao Dashboard, os dados devem ser rebuscados automaticamente.

- **`useCoreData.ts`**: mudar `refetchOnWindowFocus: false` → `true`
- **`useDashboardData.ts`**: mudar `refetchOnWindowFocus: false` → `true`

### 2. Reduzir `staleTime` do `useCoreData`
De 3 minutos para 1 minuto, para que revisões concluídas reflitam mais rápido.

### 3. Invalidar caches ao retornar ao Dashboard
No componente `SmartAlertCard` ou na página do Dashboard, adicionar invalidação quando a rota muda para `/dashboard` (o aluno volta de uma sessão de estudo).

### 4. Garantir que fluxos de revisão chamam `invalidateAll`
Verificar que os handlers de conclusão de revisão (sessão de estudo, missão) estão invalidando os caches corretamente.

## Arquivos a alterar

1. **`src/hooks/useCoreData.ts`** — `refetchOnWindowFocus: true`, `staleTime: 60_000`
2. **`src/hooks/useDashboardData.ts`** — `refetchOnWindowFocus: true`
3. **`src/lib/dashboardSnapshot.ts`** — reduzir `STALE_MS` de 10min para 5min

## O que NÃO muda
- Lógica de cálculo do `pendingRevisoes`
- SmartAlertCard (já mostra o valor correto, só precisa receber dado atualizado)
- Study Engine ou FSRS

