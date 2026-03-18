

# Plano: Repetição Espaçada de Temas + Retorno Automático ao Errar

## O que muda

A regra atual proíbe repetir o mesmo tema/conceito no mesmo bloco. O usuário quer:
1. **Poder repetir temas**, desde que não sejam em questões **consecutivas** (espaçamento)
2. **Retornar ao tema quando errar** — se errou Cardiologia na Q2, uma questão de Cardiologia deve reaparecer mais adiante (Q5 ou Q7, por exemplo)

## Mudanças

### 1. Ajustar prompt do `question-generator/index.ts`
Substituir a regra "NUNCA repita o mesmo conceito clínico/doença com o MESMO ENFOQUE" por:

- **Permitir** repetição do mesmo tema/especialidade, desde que haja **pelo menos 2 questões de intervalo** entre elas
- **Obrigar enfoque diferente** quando o tema se repete (ex: Cardiologia Q2 = diagnóstico ECG, Cardiologia Q5 = tratamento IC)
- Adicionar instrução: "QUANDO O ALUNO ERRAR uma questão, gere uma nova questão do MESMO TEMA com enfoque diferente nas próximas 3-5 questões para reforço"

### 2. Aplicar mesma lógica nos outros módulos
- `study-session/index.ts` — fase questions e active-recall
- `enamed-generator/index.ts`
- `bulk-generate-content/index.ts`
- `generate-flashcards/index.ts`

### Arquivos a editar (5)
- `supabase/functions/question-generator/index.ts`
- `supabase/functions/study-session/index.ts`
- `supabase/functions/enamed-generator/index.ts`
- `supabase/functions/bulk-generate-content/index.ts`
- `supabase/functions/generate-flashcards/index.ts`

