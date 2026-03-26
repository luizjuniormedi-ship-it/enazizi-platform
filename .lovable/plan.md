

# Plano: Limitar Plano do Dia ao tempo disponivel do aluno

## Problema
O Plano do Dia exibe TODAS as revisoes pendentes e TODOS os temas novos do cronograma, ignorando as horas diarias configuradas pelo aluno (ex: 4h). Se o aluno tem 18 temas, todos aparecem, gerando uma lista impossivel de cumprir.

## Solucao
Aplicar um filtro de tempo em 3 pontos: revisoes do cronograma, temas iniciais e blocos da IA.

## Alteracoes

### Editar `src/pages/DailyPlan.tsx`

**1. Buscar `daily_study_hours` do perfil no carregamento inicial**
- No `useEffect` de `loadToday`, adicionar query ao `profiles` para obter `daily_study_hours`
- Armazenar em state `dailyMinutes` (ex: 4h = 240min)

**2. Filtrar revisoes por tempo disponivel**
- Apos enriquecer as revisoes, ordenar por prioridade (atrasadas primeiro, depois por `prioridade` DESC)
- Somar os `estimatedMinutes` de cada revisao e cortar quando ultrapassar ~60% do tempo disponivel (reservando 40% para estudo novo/IA)
- Mover revisoes excedentes para uma secao colapsavel "Revisoes adicionais" (opcionais)

**3. Filtrar temas iniciais por tempo restante**
- Apos reservar tempo para revisoes, calcular tempo restante
- Limitar temas iniciais a ~20min cada, exibindo apenas os que cabem no tempo
- Restantes ficam em secao colapsavel "Mais temas para depois"

**4. Enviar limite de tempo para a IA**
- No `generatePlan`, ja envia `dailyHours` — mas tambem limitar `scheduledTopics` e `activeTopics` enviados, para nao sobrecarregar o prompt
- Enviar apenas os temas que couberam no filtro de tempo

**5. Mostrar indicador de tempo total vs disponivel**
- Na barra de progresso, mostrar "3h20min / 4h disponíveis" para o aluno saber que o plano respeita seu tempo

## Resultado
- Aluno com 4h/dia ve ~4h de conteudo, priorizando revisoes atrasadas
- Conteudo excedente fica acessivel mas nao sobrecarrega
- IA gera blocos dentro do tempo restante

## Arquivos
- Editar: `src/pages/DailyPlan.tsx`

