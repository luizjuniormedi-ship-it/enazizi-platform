

# Redistribuir Questões de Cursinhos para Filtros Genéricos

## Resumo
Em vez de ocultar questões com fonte de cursinhos, renomear a fonte exibida para um label genérico ("Banco Global") no filtro, mantendo todas as questões visíveis.

## Alteração

### `src/pages/QuestionsBank.tsx`
1. Remover a lógica de exclusão por `CURSINHO_KEYWORDS`
2. Criar uma função `sanitizeSource(source)` que mapeia fontes com nomes de cursinhos para `"Banco Global"`
3. Usar essa função tanto na lista de filtros (`sources`) quanto na exibição da fonte de cada questão
4. Questões continuam acessíveis, apenas o label muda

```typescript
function sanitizeSource(s: string): string {
  const CURSINHO_KEYWORDS = ['estrategia', 'medway', 'sanar', 'medcel', 'medgrupo', 'jaleko', 'afya'];
  if (CURSINHO_KEYWORDS.some(k => s.toLowerCase().includes(k))) return "Banco Global";
  return s;
}
```

| Arquivo | Mudança |
|---------|---------|
| `src/pages/QuestionsBank.tsx` | Substituir exclusão por remapeamento de fonte para "Banco Global" |

