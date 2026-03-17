

## Plano: Exame Físico Interativo (Perguntar Antes de Fornecer)

**Problema**: Atualmente, o botão "Exame Físico" envia "Realizar exame físico completo" e a IA retorna todos os achados de uma vez. Isso não é pedagógico — na prática real, o médico escolhe qual sistema examinar.

### Mudanças

**1. Prompt do sistema (edge function `clinical-simulation/index.ts`)**
- Alterar a regra de exame físico (linha 84) para funcionar igual aos exames laboratoriais/imagem: **NÃO fornecer achados automaticamente**. Primeiro perguntar qual sistema/região o aluno quer examinar (ex: "Qual sistema você gostaria de examinar? Cardiovascular, respiratório, abdome, neurológico...?").
- Só fornecer achados do sistema específico solicitado pelo aluno.
- Se o sistema examinado NÃO é o mais relevante para o caso, avisar sutilmente sem entregar o diagnóstico.

**2. Botão de ação rápida (ClinicalSimulation.tsx, linha 35)**
- Alterar o prompt do botão "Exame Físico" de "Realizar exame físico completo" para uma solicitação genérica que dispare a pergunta da IA: "Gostaria de realizar exame físico do paciente".

Essas duas mudanças garantem que o aluno precise pensar ativamente em qual sistema examinar, simulando a prática clínica real.

