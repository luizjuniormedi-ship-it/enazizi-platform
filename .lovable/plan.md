

# Plano: Paginação no Banco de Questões

## Problema
A query na linha 120 de `QuestionsBank.tsx` usa `.limit(1000)`, mas o banco já tem ~6000+ questões. As 800 importadas hoje existem no DB mas não aparecem na UI.

## Solução
Implementar paginação com "Carregar mais" e aumentar o lote inicial.

## Mudanças em `src/pages/QuestionsBank.tsx`

1. **Substituir `.limit(1000)` por `.range(0, PAGE_SIZE - 1)`** com `PAGE_SIZE = 200`
2. **Adicionar `{ count: 'exact' }` ao select** para saber o total
3. **Estado de paginação**: `page` (número), `totalCount`, `hasMore`
4. **Botão "Carregar mais"** no final da lista que busca o próximo lote e concatena ao array existente
5. **Filtros resetam a paginação** (volta para página 0)
6. **Mostrar contagem real**: "Mostrando X de Y questões"

O lote de 200 é leve o suficiente para carregar rápido, e o botão "Carregar mais" permite navegar todo o banco progressivamente.

| Arquivo | Mudança |
|---------|---------|
| `src/pages/QuestionsBank.tsx` | Paginação com range + carregar mais + contagem total |

