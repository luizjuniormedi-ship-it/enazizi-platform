

# Plano: Alerta de Questoes Geradas Automaticamente no Admin

## O que sera feito

Criar um componente `AdminDailyGenerationAlert` que aparece na tela de Admin mostrando um resumo das questoes geradas automaticamente pelo sistema no dia atual, incluindo quantidade, especialidades, dificuldade e status.

## Implementacao

### 1. Novo componente `src/components/admin/AdminDailyGenerationAlert.tsx`
- Consulta a tabela `daily_generation_log` filtrando por `run_date = hoje`
- Consulta `questions_bank` com `is_global = true` e `created_at >= hoje` para obter detalhes (dificuldade, topico)
- Exibe um card com:
  - Total de questoes geradas hoje
  - Especialidades processadas (da coluna `specialties_processed` do log)
  - Distribuicao de dificuldade (facil/medio/dificil) em mini-badges
  - Status da ultima execucao (sucesso/erro/pendente)
  - Horario das execucoes do dia
- Visual: card com icone de Database/Sparkles, fundo gradiente sutil, badges coloridos por dificuldade

### 2. Integrar no `src/pages/Admin.tsx`
- Importar e renderizar `AdminDailyGenerationAlert` logo apos `AdminPlanDistribution` (linha ~273), antes da secao de usuarios
- Visivel apenas para admins (ja esta dentro da rota protegida)

## Dados utilizados

- **`daily_generation_log`**: `run_date`, `questions_generated`, `specialties_processed` (jsonb), `status`
- **`questions_bank`**: filtro `is_global = true` + `created_at >= hoje` para contar por dificuldade e topico

## Impacto

Apenas frontend. Nenhuma migracao necessaria — ambas as tabelas ja existem com RLS adequado para admins.

