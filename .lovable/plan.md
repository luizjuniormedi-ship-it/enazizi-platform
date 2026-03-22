

# Plano: Redesign do Banco de Erros — UX Intuitiva e Visual

## Problemas Atuais
- Layout denso e pouco visual — parece uma lista genérica
- Sem gráficos de evolução temporal (o aluno não vê se está melhorando)
- Sem filtros por tipo de questão ou categoria de erro
- Deletar erro perde histórico — deveria "marcar como dominado"
- Cards de erro mostram muitas badges inline, difícil escanear
- Sem indicador de tendência (melhorando/piorando por tema)
- Ordenação fixa (só por vezes_errado)

## Mudanças

### 1. Migração SQL — Colunas `dominado` e `dominado_em`
- Adicionar `dominado boolean DEFAULT false` e `dominado_em timestamptz` à tabela `error_bank`
- Permite marcar erros como superados sem perder histórico

### 2. Gráfico de Evolução Semanal (topo da página)
- Mini line chart (Recharts, já disponível) mostrando erros por semana nas últimas 8 semanas
- Calculado a partir de `created_at` dos erros
- Dá feedback visual: "seus erros estão diminuindo"

### 3. Filtros e Ordenação
- Dropdown para filtrar por `tipo_questao` (objetiva, flashcard, simulado, etc.)
- Dropdown para filtrar por `categoria_erro` (conceito, fisiopatologia, etc.)
- Toggle de ordenação: "Mais errado" vs "Mais recente"
- Chips de filtro ativo com botão de limpar

### 4. Botão "Dominei" em vez de Deletar
- Substituir botão de lixeira por botão "✓ Dominei"
- Marca `dominado = true, dominado_em = now()` em vez de deletar
- Seção colapsável "Erros Dominados" no final (com contagem)
- Manter botão de deletar como ação secundária dentro do dominado

### 5. Indicador de Tendência por Tema
- Na lista de temas à esquerda, mostrar seta ↑ (piorando) ou ↓ (melhorando) baseado em: se erros recentes (últimos 7 dias) são menos que antes
- Badge verde "Melhorando" ou vermelho "Piorando"

### 6. Cards de Erro Redesenhados
- Layout mais limpo: tema como header, badges abaixo em linha separada
- Barra de "gravidade" visual (1-5x = amarelo, 5-10x = laranja, 10x+ = vermelho)
- Ícone de tipo de questão em vez de texto
- Motivo do erro sempre visível (não só no hover)

### 7. Empty State Melhorado
- Ilustração + call-to-action direcionando para módulos que geram erros

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| **Migração SQL** | `dominado` + `dominado_em` na `error_bank` |
| `src/pages/ErrorBank.tsx` | Redesign completo: gráfico evolução, filtros, dominei, tendência, cards redesenhados |

## Detalhes Técnicos
- Gráfico usa `LineChart` do Recharts (já importado em outros componentes)
- Filtros são estados locais (sem query extra ao banco)
- Tendência calculada client-side comparando erros dos últimos 7d vs 7d anteriores
- Seção "dominados" usa query separada com `dominado = true`

