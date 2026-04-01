

# Corrigir Build do Painel Professor

## Problema

Linhas 196-204 em `ProfessorDashboard.tsx` contêm código órfão — o corpo de uma função `viewResults` perdeu sua declaração `const viewResults = async (simulado: any) => {`. Isso causa erro de build porque há `await` fora de função async.

## Correção

### `src/pages/ProfessorDashboard.tsx` (linha 195-196)

Adicionar a declaração da função que foi perdida:

```typescript
  // Linha 195 (após o fechamento de deleteSimulado)

  const viewResults = async (simulado: any) => {   // ← ADICIONAR ESTA LINHA
    setResultsDialog({ open: true, simulado, results: [], loading: true });
```

Uma única linha resolve o build e restaura o painel professor.

