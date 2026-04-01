

# Atualizar Login para Funcionar Bem em Todos os Dispositivos

## Problemas Identificados

1. **Login.tsx**: Usa `min-h-screen` sem `overflow-y-auto` — no mobile pequeno, o formulário + hero panel podem ficar cortados sem scroll
2. **Login.tsx**: Não usa `100dvh` (dynamic viewport height) — em mobile com barra de navegação do browser, o conteúdo fica escondido atrás da barra
3. **Login.tsx**: No mobile, o hero panel ocupa muito espaço vertical empurrando o formulário para fora da tela

## Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Login.tsx` | Trocar `min-h-screen` por `min-h-[100dvh]`, adicionar `overflow-y-auto`. No mobile, comprimir o hero panel (esconder features list, reduzir padding). Garantir que o formulário fique sempre acessível com scroll |

## Detalhes Técnicos

- Container principal: `min-h-[100dvh] overflow-y-auto` em vez de `min-h-screen`
- Hero panel: esconder a lista de features no mobile (`hidden sm:grid`) para reduzir altura
- Manter tudo funcional em desktop, tablet e mobile (inclusive PWA e Capacitor)

