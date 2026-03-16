

## Plano: Diagnósticos Diferenciais no Relatório Final

### O que muda

**1. Backend — Expandir o prompt de finalização (`supabase/functions/clinical-simulation/index.ts`)**

Adicionar ao JSON de `action="finish"` um novo campo `differential_diagnosis` que a IA deve retornar, contendo:
- Lista de 3-5 diagnósticos diferenciais relevantes para o caso
- Para cada diferencial: nome, por que deveria ser considerado, como descartar (exame/achado chave), e se o aluno mencionou/descartou durante o atendimento

Estrutura no prompt:
```json
"differential_diagnosis": [
  {
    "diagnosis": "nome do diagnóstico diferencial",
    "reasoning": "por que entra no diferencial deste caso",
    "how_to_rule_out": "exame ou achado que descarta",
    "student_considered": true/false
  }
]
```

**2. Frontend — Nova seção no relatório final (`src/pages/ClinicalSimulation.tsx`)**

Adicionar uma card "Diagnósticos Diferenciais" entre a "Correção Diagnóstica" e a "Avaliação por Categoria", exibindo:
- Cada diagnóstico diferencial com ícone indicando se o aluno considerou ou não
- Raciocínio clínico de por que entra no diferencial
- Como descartar — aspecto educativo central
- Visual: verde se o aluno considerou, cinza se não considerou

**3. Atualizar a interface `FinalEval`**

Adicionar `differential_diagnosis` como campo opcional na interface TypeScript.

### Valor pedagógico

O diferencial é essencial para residência médica. Ao mostrar quais diferenciais o aluno pensou e quais ignorou, reforça o raciocínio clínico sistemático e ensina a descartar hipóteses com achados específicos.

### Arquivos alterados
- `supabase/functions/clinical-simulation/index.ts` — prompt expandido
- `src/pages/ClinicalSimulation.tsx` — interface + nova card no resultado

