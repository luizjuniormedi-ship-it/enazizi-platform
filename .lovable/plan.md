

# Adicionar Filtro de Banca/Origem no Gerador de Questões e Simulados

## Problema

Os módulos Gerador de Questões e Simulados não possuem filtro para selecionar a **banca da prova** (ENARE, REVALIDA, USP-SP, UNIFESP, etc.) nem a **origem** da questão. O prompt gerado não menciona o estilo de banca, resultando em questões genéricas.

## Mudanças

### 1. `src/pages/QuestionGenerator.tsx` — Adicionar seletor de Banca

- Novo state `examBoard` (ex: "ENARE", "REVALIDA", "USP-SP", "UNIFESP", "SUS-SP", "todas")
- Adicionar `Select` com as bancas disponíveis na tela de setup, entre Dificuldade e Quantidade
- Incluir banca no `buildPrompt()`: "no estilo da prova {banca}, com formato e pegadinhas típicas dessa banca"
- Incluir banca no subtitle do `AgentChat`

### 2. `src/components/simulados/SimuladoSetup.tsx` — Adicionar seletor de Banca

- Novo state `examBoard`
- Adicionar `Select` com bancas na tela de configuração
- Propagar `examBoard` no `onStart()` (atualizar interface `onStart`)

### 3. `src/pages/Simulados.tsx` — Usar banca no prompt

- Receber `examBoard` da config
- Injetar no `buildPrompt()`: estilo e formato específico da banca selecionada
- Ao buscar questões reais do banco (`questions_bank`), filtrar por `source` quando banca específica

### Bancas disponíveis

| Valor | Label |
|---|---|
| `all` | Todas as bancas |
| `ENARE` | ENARE |
| `REVALIDA` | REVALIDA |
| `USP-SP` | USP-SP |
| `UNIFESP` | UNIFESP |
| `SUS-SP` | SUS-SP |
| `UNICAMP` | UNICAMP |
| `SANTA_CASA` | Santa Casa SP |

### Arquivos Impactados

| Arquivo | Mudança |
|---|---|
| `src/pages/QuestionGenerator.tsx` | State `examBoard`, Select UI, atualizar `buildPrompt()` |
| `src/components/simulados/SimuladoSetup.tsx` | State `examBoard`, Select UI, propagar no `onStart` |
| `src/pages/Simulados.tsx` | Receber `examBoard`, injetar no prompt de geração |

