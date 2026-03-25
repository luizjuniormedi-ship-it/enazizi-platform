

# Revisao de Qualidade: Questoes "real-exam-ai"

## Diagnostico Atual

| Metrica | real-exam-ai | daily-auto |
|---------|-------------|------------|
| Total | 12 | 340 |
| Tamanho medio enunciado | 330 chars | 713 chars |
| Dificuldade media | 3.3 | 3.6 |

## Problemas Identificados

### 1. Questoes NAO sao reais — sao genericas disfarçadas
As questoes marcadas como "real-exam-ai" **nao reproduzem provas reais**. Exemplos:
- "Um estudante observa uma lamina de tecido muscular... fibras longas, multinucleadas..." → questao basica de livro-texto, nao de ENARE 2020
- "Qual a principal funcao destas estruturas no ovario?" → pergunta conceitual pura, **violando** a regra de proibir "O que e X?"
- Fontes como "REVALIDA INEP 2016" e "UNICAMP 2023" sao **fabricadas** pela IA

### 2. Enunciados curtos demais (330 vs 713 chars)
Questoes de residencia real tem caso clinico completo. As geradas sao 2x mais curtas que as do `daily-auto`.

### 3. Dificuldade abaixo do padrao
Questao com `difficulty: 2` passou pelo filtro (o codigo exige `≥ 3` para daily-auto mas NAO filtra dificuldade para real-exam-ai).

### 4. Falta de caso clinico
As questoes de Histologia e Genetica sao quase todas conceituais — sem anamnese, sinais vitais, exames complementares.

## Plano de Correcao

### Arquivo: `supabase/functions/daily-question-generator/index.ts`

**Correcoes na funcao `searchRealQuestionsViaAI`:**

1. **Adicionar filtro de dificuldade >= 3** (igual ao daily-auto) na validacao pos-geracao
2. **Aumentar exigencia de tamanho do enunciado para >= 250 chars** (vs 150 atual)
3. **Reforcar prompt** para exigir caso clinico completo mesmo em questoes "reais" — eliminar questoes puramente conceituais
4. **Adicionar validacao de conteudo clinico**: rejeitar questoes que nao contenham pelo menos 2 de: idade/sexo do paciente, achado clinico, exame complementar
5. **Renomear source para `"ai-exam-style"`** para ser honesto sobre a origem (nao sao questoes reais reproduzidas)

**Correcao no prompt:**
- Remover instrucao de "reproduzir fielmente" (a IA inventa fontes)
- Substituir por: "Gere questoes NO ESTILO e NIVEL de provas reais, citando a banca como referencia de nivel"
- Exigir obrigatoriamente caso clinico com dados de paciente

**Limpeza de dados existentes:**
- Marcar as 12 questoes atuais com `review_status = 'needs_review'` para revisao manual ou exclusao

### Resultado Esperado
- Questoes "exam-style" terao mesma qualidade e profundidade que as `daily-auto`
- Diferencial: prompt otimizado para replicar o estilo especifico de cada banca
- Sem mais fontes fabricadas enganando o usuario

