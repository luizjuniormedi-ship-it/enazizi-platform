

# Plano: Forcar atualizacao do cronograma apos novo plano

## Problema
Apos gerar um novo plano de estudo, o `loadData()` na linha 579 do `CronogramaInteligente.tsx` nao e awaited. Isso causa uma race condition: o tab muda para "hoje" (via `onSyncComplete`) antes dos dados serem carregados, e a Visao Geral e demais abas mostram dados desatualizados ou vazios.

## Solucao

### Editar `src/pages/CronogramaInteligente.tsx`

1. **Awaitar `loadData` apos a sincronizacao** (linha 579): trocar `loadData()` por `await loadData()` para garantir que os dados estejam prontos antes de retornar o resumo

2. **Chamar `loadData` no `onSyncComplete`**: quando o usuario clica "Ver Agenda de Hoje", chamar `loadData` novamente para garantir dados frescos
   - Mudar `onSyncComplete={() => setTab("hoje")}` para `onSyncComplete={async () => { await loadData(); setTab("hoje"); }}`

3. **Chamar `loadData` sempre que a tab mudar**: adicionar um efeito que recarrega dados ao trocar de tab (para "visao", "hoje", "temas", "criticos", etc.)
   - Adicionar `useEffect` que chama `loadData()` quando `tab` muda (com debounce para nao sobrecarregar)

## Resultado
Todas as abas do cronograma (Visao Geral, Temas, Criticos, Graficos, Historico) refletem os dados do novo plano imediatamente.

## Arquivos
- Editar: `src/pages/CronogramaInteligente.tsx`

