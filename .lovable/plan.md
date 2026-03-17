

# Plano: Implementar itens 3 e 4

## Item 3 — Estados vazios com CTAs (`StudentSimulados.tsx`)

### Mudanca 1: Estado vazio de Simulados (linhas 289-295)
Adicionar botoes de acao abaixo da mensagem "Nenhum simulado atribuido":
- **"Praticar com Tutor IA"** → navega para `/dashboard/chatgpt`
- **"Gerar Questoes"** → navega para `/dashboard/questoes`

### Mudanca 2: Estado vazio de Plantoes (linhas 376-382)
Adicionar botao de acao abaixo da mensagem "Nenhum plantao atribuido":
- **"Treinar Anamnese"** → navega para `/dashboard/anamnese`

## Item 4 — Menu mobile com grupos colapsaveis

Ja esta implementado no `DashboardLayout.tsx` (componente `MobileNavGroupSection` com `ChevronDown` e estado `isOpen`). Nenhuma mudanca necessaria.

## Resumo

| Arquivo | Alteracao |
|---|---|
| `src/pages/StudentSimulados.tsx` | +2 blocos de botoes CTA nos estados vazios |

Mudanca pequena e localizada — apenas 1 arquivo editado.

