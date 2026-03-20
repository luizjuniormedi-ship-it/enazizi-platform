

# Botão "Como Usar" Dinâmico por Aba no Cronograma

## Problema
O botão "Como usar" no Cronograma mostra sempre os mesmos passos genéricos, independente da aba ativa. O usuário quer ver instruções específicas da aba em que está.

## Solução
Tornar o `ModuleHelpButton` do Cronograma dinâmico — os `steps` e `moduleName` mudam conforme a `tab` ativa.

## Alteração

### `src/components/cronograma/CronogramaHeader.tsx`
Criar um mapa `TAB_HELP` com instruções específicas por aba:

| Aba | Título no Popover | Passos (resumo) |
|---|---|---|
| `visao` | Visão Geral | KPIs, prioridades, atalhos rápidos |
| `hoje` | Agenda do Dia | Lista de revisões, ordenação por risco, registrar desempenho |
| `novo` | Novo Tema | Preencher tema, especialidade, dificuldade, fonte |
| `temas` | Todos os Temas | Buscar, filtrar, editar, excluir temas |
| `criticos` | Temas Críticos | Temas com baixa retenção, revisar urgente |
| `plano` | Plano de Estudos | Importar edital PDF, gerar temas automático |
| `historico` | Histórico | Revisões passadas, filtrar por período |
| `graficos` | Gráficos | Evolução, taxa acerto, distribuição |
| `config` | Configurações | Meta diária, horários, notificações |

O `ModuleHelpButton` receberá `moduleName` e `steps` do mapa baseado na `tab` atual. Chave do localStorage será `cronograma_${tab}` para controlar badge por aba.

### Arquivo modificado
- `src/components/cronograma/CronogramaHeader.tsx` — substituir steps fixos por mapa dinâmico

