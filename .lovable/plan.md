

# Revisar Lista de Universidades e Remover "Outra"

## Mudança

Atualizar `src/constants/faculdades.ts`:
- Remover a opção `"Outra"` (linha 131) e o comentário `// Última opção` (linha 130)
- A lista atual de universidades (federais, estaduais, privadas/comunitárias) está completa e bem organizada — será mantida como está

## Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/constants/faculdades.ts` | Remover `"Outra"` e comentário associado |

## Resultado

O combobox de faculdade mostrará apenas universidades reais, sem a opção genérica "Outra".

