

# Plano: Corrigir seletor de materiais de contexto

## Problema

1. Query carrega uploads de **todos os usuarios** (sem filtro `user_id`)
2. **Auto-seleciona todos** (ate 50), gerando "50 de 50 materiais como contexto"
3. Envia texto desnecessario a IA, aumentando latencia/custo
4. UI do seletor e pequena e pouco clara

## Mudancas

### Arquivo: `src/components/agents/AgentChat.tsx`

| Mudanca | Detalhe |
|---|---|
| Filtrar por usuario | Adicionar `.eq("user_id", user.id)` na query (linha 142-148) |
| Limitar a 20 | Reduzir `.limit(50)` para `.limit(20)` |
| Iniciar com nenhum selecionado | `setSelectedUploadIds(new Set())` ao inves de selecionar todos |
| Melhorar UI do indicador | Redesenhar o botao de contexto: icone mais claro, badge com contagem, cores distintas para 0 vs N selecionados |
| Melhorar lista expandida | Adicionar barra de busca simples (filtro local por nome), limitar altura visivel, mostrar tamanho do texto extraido por arquivo |
| Esconder indicador quando 0 uploads | Quando nao ha materiais e `showUploadButton` e false, nao mostrar o indicador vazio |
| Welcome message condicional | So mostrar welcome com uploads quando usuario selecionar materiais manualmente |

### Detalhes visuais

- Indicador compacto: `📎 3 materiais selecionados` com badge colorido
- Quando 0 selecionados: texto cinza `Nenhum material como contexto`
- Lista com campo de filtro no topo para achar materiais rapidamente
- Cada item mostra nome truncado + badge de categoria + indicador de tamanho (ex: "2.1k chars")
- Botao "Selecionar todos / Nenhum" mais visivel

