

# Incluir Exame Físico na Avaliação Final da Anamnese

## Ideia

Atualmente, ao finalizar um caso de anamnese, a IA avalia as perguntas feitas e o raciocínio clínico, mas **não mostra quais achados de exame físico o aluno deveria buscar** com base na história coletada. Adicionar isso cria uma ponte entre anamnese → exame físico → diagnóstico.

## O que muda

### 1. Prompt da edge function (`supabase/functions/anamnesis-trainer/index.ts`)

Na seção `action="finish"`, adicionar ao JSON de resposta um novo campo obrigatório:

```text
"physical_exam_expected": {
  "inspection": ["achado → significado"],
  "palpation": ["achado → significado"],
  "maneuvers": [
    { "name": "Nome da Manobra", "technique": "Como fazer", "positive_finding": "Achado positivo", "indicates": "O que indica" }
  ],
  "auscultation": ["achado → significado (quando aplicável)"],
  "vital_signs_expected": "sinais vitais esperados para este caso"
}
```

E adicionar instrução no prompt: *"Com base na anamnese coletada e no diagnóstico oculto, descreva os achados de exame físico esperados, manobras específicas com nome técnico, e sinais vitais alterados."*

### 2. Frontend (`src/pages/AnamnesisTrainer.tsx`)

Na tela de resultado final, adicionar uma nova seção visual **"🩺 Exame Físico Esperado"** que renderiza:
- Inspeção, Palpação, Ausculta como listas
- Manobras em formato de cards com nome, técnica, achado positivo e significado
- Sinais vitais esperados

## Impacto

- 2 arquivos editados
- Zero mudança em rotas ou lógica de negócio
- O aluno aprende **o que procurar no exame físico** após cada caso de anamnese

