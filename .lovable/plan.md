

# Adicionar Prioridades de Subtópicos aos Geradores de Questões

## Resumo
Criar um mapa de subtópicos prioritários (high-yield) por especialidade no constants e injetá-los nos prompts dos geradores para que a IA dê preferência a esses temas quando nenhum subtema específico for selecionado.

## Alterações

### 1. `src/constants/subtopics.ts` — Novo export `HIGH_YIELD_SUBTOPICS`

Adicionar um mapa com os subtópicos mais cobrados por especialidade (top 3-5 por área):

```typescript
export const HIGH_YIELD_SUBTOPICS: Record<string, string[]> = {
  "Cardiologia": ["Insuficiência Cardíaca", "Síndromes Coronarianas Agudas", "Hipertensão Arterial", "Arritmias", "Endocardite"],
  "Cirurgia": ["Abdome Agudo", "Politrauma", "Hérnias", "Colecistite", "Apendicite"],
  "Pediatria": ["Neonatologia", "Aleitamento Materno", "Bronquiolite", "Doenças Exantemáticas", "Imunização", "Reanimação Neonatal", "Icterícia Neonatal"],
  "Ginecologia e Obstetrícia": ["Pré-eclâmpsia", "Hemorragias da Gestação", "Pré-natal", "Diabetes Gestacional", "Anticoncepção", "Trabalho de Parto"],
  "Medicina Preventiva": ["SUS", "Epidemiologia", "Vacinação", "Estudos Epidemiológicos", "Bioestatística", "Ética e Bioética Médica"],
  "Infectologia": ["HIV/AIDS", "Tuberculose", "Sepse", "Arboviroses", "Meningites"],
  "Pneumologia": ["Asma", "DPOC", "Pneumonia", "Tuberculose Pulmonar", "Tromboembolismo Pulmonar", "Derrame Pleural"],
  "Gastroenterologia": ["Doença do Refluxo", "Hemorragia Digestiva", "Cirrose Hepática", "Hepatites Virais", "Doença Inflamatória Intestinal"],
  "Endocrinologia": ["Diabetes Mellitus", "Tireoidopatias", "Cetoacidose Diabética", "Dislipidemias"],
  "Neurologia": ["AVC Isquêmico", "Epilepsia", "Cefaléias", "Meningites"],
  "Dermatologia": ["Hanseníase", "Câncer de Pele", "Lesões Elementares da Pele", "Piodermites"],
  "Nefrologia": ["Insuficiência Renal Aguda", "Distúrbios Hidroeletrolíticos", "Distúrbios Ácido-Base", "Glomerulopatias"],
  "Hematologia": ["Anemias", "Leucemias", "Linfomas", "Distúrbios da Hemostasia"],
  "Reumatologia": ["Lúpus Eritematoso Sistêmico", "Artrite Reumatoide", "Vasculites"],
  "Oncologia": ["Câncer de Mama", "Câncer Colorretal", "Câncer de Pulmão", "Estadiamento TNM"],
  "Medicina de Emergência": ["PCR e RCP", "Choque", "Trauma", "Anafilaxia"],
  "Angiologia": ["Trombose Venosa Profunda", "Doença Arterial Periférica", "Aneurisma de Aorta"],
  "Psiquiatria": ["Depressão", "Esquizofrenia", "Emergências Psiquiátricas", "Dependência Química"],
  "Urologia": ["Litíase Renal", "Infecção Urinária", "Hiperplasia Prostática"],
  "Terapia Intensiva": ["Ventilação Mecânica", "Sepse e Choque Séptico", "SDRA"],
};
```

### 2. `supabase/functions/professor-simulado/index.ts` — Injetar prioridades no prompt

No case `generate_questions`, quando nenhum subtópico específico é passado, adicionar ao prompt:
```
SUBTÓPICOS PRIORITÁRIOS (dar preferência a estes por serem os mais cobrados em provas):
- Cardiologia: Insuficiência Cardíaca, Síndromes Coronarianas Agudas, ...
```

Importar o mapa HIGH_YIELD inline (edge functions não importam de src/) — copiar apenas os arrays relevantes para os `topics` selecionados.

### 3. `supabase/functions/question-generator/index.ts` — Injetar prioridades no prompt

No `jsonSystemPrompt` e `fullSystemPrompt`, quando o tópico da mensagem do usuário bate com uma especialidade, adicionar instrução de prioridades. Passar o mapa inline como constante no edge function.

### 4. `src/pages/QuestionGenerator.tsx` — Passar prioridades na mensagem

Quando o usuário seleciona uma especialidade sem subtemas específicos, incluir os high-yield subtopics na mensagem enviada ao edge function para que a IA priorize esses temas.

## Fluxo

```text
Sem subtema selecionado:
  Frontend detecta especialidade → busca HIGH_YIELD[especialidade]
  → injeta no prompt: "Priorize os temas mais cobrados: X, Y, Z"
  → IA gera questões com foco nesses subtópicos

Com subtema selecionado:
  Comportamento atual mantido (usa os subtemas escolhidos pelo usuário)
```

| Arquivo | Mudança |
|---------|---------|
| `src/constants/subtopics.ts` | Novo export `HIGH_YIELD_SUBTOPICS` com top 3-5 subtópicos por especialidade |
| `supabase/functions/professor-simulado/index.ts` | Injetar prioridades no prompt quando sem subtemas específicos |
| `supabase/functions/question-generator/index.ts` | Injetar prioridades no prompt do gerador de questões |
| `src/pages/QuestionGenerator.tsx` | Enviar high-yield hints na mensagem quando sem subtemas |

