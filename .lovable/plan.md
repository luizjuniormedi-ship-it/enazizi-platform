

# Plano: Ampliar base de questões do Nivelamento com anti-repetição

## Problema
- O banco de fallback tem apenas ~5 questões por área (40 total), causando repetição
- O prompt da IA não envia lista de patologias/enunciados já usados para evitar duplicatas
- Não há validação pós-geração contra repetição de patologia

## Solução

### 1. Expandir banco de fallback (`diagnosticFallbackQuestions.ts`)
- Ampliar de 5 para **10 questões por área** no `FALLBACK_BANK`, cobrindo patologias distintas
- Cada área terá 10 casos clínicos com patologias únicas (ex: Clínica Médica — ICC, CAD, PAC, AVC, TEP, DPOC exacerbada, ITU complicada, crise tireotóxica, hemorragia digestiva, LRA)
- `getFallbackQuestionsForArea` fará shuffle aleatório e retornará o número solicitado, evitando a mesma ordem

### 2. Anti-repetição no prompt da IA (`Diagnostic.tsx`)
- Ao gerar questões por área, coletar lista de **patologias/diagnósticos** já presentes em `allQuestions` (não apenas 3 trechos de enunciado)
- Enviar ao prompt uma lista explícita: `PATOLOGIAS JÁ USADAS (PROIBIDO REPETIR): ICC, CAD, PAC...`
- Adicionar regra: `PROIBIDO repetir a mesma patologia/diagnóstico principal em qualquer questão deste exame`

### 3. Validação pós-parse
- Após parsear as questões da IA, filtrar duplicatas por similaridade de enunciado (primeiros 80 chars) contra questões já acumuladas em `allQuestions`
- Se duplicata detectada, descartar e preencher com fallback

## Arquivos a modificar
- `src/lib/diagnosticFallbackQuestions.ts` — expandir para 10 questões/área + shuffle
- `src/pages/Diagnostic.tsx` — anti-repetição no prompt + validação pós-parse

