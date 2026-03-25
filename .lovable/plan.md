

# Plano: Dashboard BI de Usuarios na Administracao

## O que sera feito

Criar uma nova aba "BI" no painel admin com dashboards visuais que agregam dados reais de todos os usuarios: desempenho academico, tempo de uso, engajamento por modulo, distribuicao por universidade/periodo, e tendencias temporais.

## Componente novo

`src/components/admin/AdminBIPanel.tsx` — painel completo com graficos e metricas agregadas.

## Dados que serao coletados

Nova action `get_bi_data` no edge function `admin-actions/index.ts` que agrega:

1. **Desempenho geral**: media de acuracia, total de questoes respondidas (practice_attempts + exam_sessions + teacher_simulado_results)
2. **Engajamento por modulo**: contagem de uso de cada modulo (questions_bank, simulation_history, anamnesis_results, discursive_attempts, summaries, uploads)
3. **Usuarios por universidade**: agrupamento de profiles por faculdade
4. **Usuarios por periodo**: agrupamento de profiles por periodo
5. **Atividade temporal**: practice_attempts agrupados por dia (ultimos 30 dias) para grafico de linha
6. **Top usuarios por questoes**: ranking dos 10 mais ativos
7. **Presenca/tempo de uso**: dados de user_presence para calcular tempo medio na plataforma
8. **Taxa de retencao**: usuarios ativos nos ultimos 7 dias vs total

## Visualizacoes (usando Recharts ja instalado)

| Widget | Tipo | Dados |
|---|---|---|
| KPIs resumo | Cards | Total questoes, acuracia media, usuarios ativos 7d, retencao |
| Atividade diaria | AreaChart | Questoes/dia ultimos 30 dias |
| Engajamento por modulo | BarChart horizontal | Contagem por modulo |
| Distribuicao por universidade | PieChart | Usuarios por faculdade |
| Distribuicao por periodo | BarChart | Usuarios por periodo |
| Top 10 usuarios | Tabela | Nome, questoes, acuracia, ultimo acesso |
| Horarios de pico | BarChart | user_presence agrupado por hora |

## Arquivos a alterar

| Arquivo | Mudanca |
|---|---|
| **Novo:** `src/components/admin/AdminBIPanel.tsx` | Componente com todos os graficos e KPIs |
| `src/pages/Admin.tsx` | Adicionar aba "BI" nas TabsList/TabsContent |
| `supabase/functions/admin-actions/index.ts` | Nova action `get_bi_data` com queries agregadas |

## Detalhes tecnicos

**Edge function `get_bi_data`:**
- Faz queries agregadas usando `supabaseAuth` (service_role)
- Retorna dados ja processados para o frontend renderizar
- Consulta: profiles (faculdade, periodo, status), practice_attempts (created_at, correct), user_presence (last_seen_at, current_page), exam_sessions, simulation_history, etc.

**Frontend:**
- Usa `ChartContainer` / Recharts components ja existentes no projeto
- Estado `biData` com loading, carrega ao montar a aba
- Reutiliza `callAdmin({ action: "get_bi_data" })` do Admin.tsx

