

# Adicionar Diagnóstico Diferencial + Link para Tutor na Correção da Anamnese e Plantão

## Resumo

Duas mudanças principais:
1. **Anamnese**: Adicionar seção de diagnósticos diferenciais na correção final (o Plantão já tem, a Anamnese não)
2. **Ambos**: Adicionar botão "Estudar no Tutor IA" nos erros/pontos fracos, que abre o Tutor com contexto do erro

## Mudanças

### 1. `supabase/functions/anamnesis-trainer/index.ts`
No JSON de finalização (action="finish"), adicionar campo `differential_diagnosis`:
```json
"differential_diagnosis": [
  { "diagnosis": "...", "reasoning": "por que considerar", "how_to_rule_out": "como descartar", "student_considered": true/false }
]
```
Mesma estrutura já usada no Plantão.

### 2. `src/pages/AnamnesisTrainer.tsx`
- Adicionar `useNavigate` do react-router-dom
- Adicionar interface `DifferentialDiagnosis` ao `FinalEval`
- Na tela de resultado, renderizar seção de **Diagnósticos Diferenciais** (cards com ícone, reasoning, how_to_rule_out — mesmo visual do Plantão)
- Adicionar botão **"📚 Aprofundar no Tutor IA"** após o diagnóstico correto e nos pontos a melhorar, que navega para `/dashboard/chatgpt` com `state.initialMessage` contendo o contexto do erro/tema

### 3. `src/pages/ClinicalSimulation.tsx`
- Adicionar `useNavigate` do react-router-dom
- Adicionar botão **"📚 Aprofundar no Tutor IA"** na seção de diagnósticos diferenciais e nos pontos a melhorar, com mesmo padrão de navegação

### Navegação para o Tutor
O botão enviará o aluno para `/dashboard/chatgpt` com `state`:
```ts
navigate("/dashboard/chatgpt", {
  state: {
    initialMessage: `🔬 MODO REVISÃO CLÍNICA\n\nO aluno errou/teve dificuldade no seguinte caso:\n- Diagnóstico correto: ${correctDiagnosis}\n- Diferenciais não considerados: ${missed}\n- Pontos fracos: ${improvements}\n\nExplique detalhadamente...`,
  }
});
```

## Impacto
- 3 arquivos editados
- 1 edge function atualizada
- Zero mudança em rotas ou lógica de negócio
- Reutiliza o visual de diferenciais já existente no Plantão

