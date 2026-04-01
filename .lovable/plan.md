

# Fix: Dashboard do Equalizador Travado / Não Atualiza

## Causa raiz

1. **Limite de 1000 linhas**: `loadDistribution()` faz `supabase.from("questions_bank").select("topic")` sem paginação. Com 3000+ questões, o Supabase retorna apenas 1000 linhas, gerando contagens erradas e déficits inflados.

2. **Não atualiza durante o processo**: O `loadDistribution()` só é chamado no final (`linha 247`). Se o equalizador falha no meio, a distribuição fica estale.

3. **Não atualiza após erro**: O bloco `catch` (linha 248) não chama `loadDistribution()`.

## Correção

### 1. `AdminIngestionPanel.tsx` — Substituir query por contagem agregada via RPC ou loop paginado

Trocar o `select("topic")` por uma query que use `select("topic", { count: "exact" })` com agrupamento, ou fazer paginação completa:

```typescript
// Opção: buscar contagens com query paginada
const loadDistribution = async () => {
  let allTopics: string[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await supabase.from("questions_bank")
      .select("topic")
      .eq("is_global", true)
      .range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    allTopics.push(...data.map(r => r.topic || "Outros"));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  // ... contar normalmente com allTopics
};
```

### 2. Atualizar distribuição após cada batch e após erro

- Dentro do loop `for` (após cada especialidade processada), chamar `loadDistribution()` para atualizar as contagens em tempo real
- No bloco `finally` (linha 250), sempre chamar `loadDistribution()` para garantir atualização mesmo em caso de erro

### 3. Adicionar botão de refresh manual

Adicionar um botão de atualizar (ícone RefreshCw) ao lado do título da distribuição para o admin poder forçar reload a qualquer momento.

## Arquivos alterados

- `src/components/admin/AdminIngestionPanel.tsx`

## Resultado

- Contagens corretas mesmo com 3000+ questões no banco
- Dashboard atualiza em tempo real durante a equalização
- Sempre atualiza após erro ou pausa
- Botão de refresh manual disponível

