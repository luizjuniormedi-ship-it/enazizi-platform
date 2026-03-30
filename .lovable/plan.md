

# Incluir Seção de Exame Físico Esperado na Avaliação Final do Plantão

## Contexto

Na Anamnese, ao finalizar, o sistema já mostra os achados de exame físico esperados e manobras diagnósticas. No Plantão (Simulação Clínica), a avaliação final já tem categorias detalhadas (anamnese, exame físico, conduta, etc.), mas **não inclui uma seção estruturada com os achados de exame físico que o aluno deveria ter encontrado e as manobras diagnósticas específicas do caso**.

## O que será feito

Adicionar ao JSON de finalização do Plantão um novo campo `physical_exam_expected` (idêntico ao da Anamnese) e renderizá-lo na tela de resultado.

## Mudanças

### 1. `supabase/functions/clinical-simulation/index.ts`
Na seção `action="finish"` (linha ~196-226), adicionar ao JSON de resposta:

```text
"physical_exam_expected": {
  "inspection": ["achado → significado"],
  "palpation": ["achado → significado"],
  "auscultation": ["achado → significado"],
  "vital_signs_expected": "sinais vitais esperados para este diagnóstico",
  "maneuvers": [
    { "name": "Nome da Manobra", "technique": "Como executar", "positive_finding": "Achado positivo", "indicates": "O que indica" }
  ]
}
```

E adicionar instrução: *"Com base no diagnóstico oculto e no quadro clínico, descreva os achados de exame físico esperados, manobras semiológicas específicas com nome técnico, técnica de execução e interpretação."*

### 2. `src/pages/ClinicalSimulation.tsx`
Na tela de resultado final, adicionar seção **"🩺 Exame Físico Esperado"** após a avaliação existente, renderizando:
- Inspeção, Palpação, Ausculta como listas
- Manobras em cards com nome, técnica, achado positivo e significado
- Sinais vitais esperados

## Impacto
- 2 arquivos editados
- Zero mudança em rotas ou lógica de negócio
- O aluno aprende quais achados e manobras deveria ter buscado em cada caso clínico

