

# Criação Manual de Caso Clínico no Painel do Professor

## Situação Atual
O fluxo de criação de casos clínicos no `ProfessorPlantao.tsx` só permite geração via IA (botão "Gerar Caso via IA"). O professor não pode inserir manualmente os dados do caso.

## Mudança Proposta

Adicionar uma opção de **modo de criação** no dialog existente: **"IA"** ou **"Manual"**. Quando "Manual" for selecionado, o professor preenche todos os campos do caso clínico diretamente:

### Campos do Formulário Manual
- **Apresentação do paciente** (textarea) — queixa em 1ª pessoa
- **Sinais vitais** — PA, FC, FR, Temp, SpO2 (inputs individuais)
- **Cenário** — PS, UTI, Enfermaria, UBS (select)
- **Cor de triagem** — vermelho, amarelo, verde (select)
- **Diagnóstico correto** (oculto ao aluno) — texto livre
- **Achados-chave** — até 5 achados (inputs dinâmicos)
- **Dificuldade score** — slider 1-5

### Arquivos Alterados
1. **`src/components/professor/ProfessorPlantao.tsx`**
   - Adicionar toggle IA/Manual no topo do dialog de criação (tabs ou radio)
   - No modo Manual: renderizar formulário com todos os campos acima
   - Ao submeter, montar o objeto `case_prompt` no mesmo formato que a IA retorna e seguir o fluxo existente (`createCase`)
   - O botão "Gerar Caso via IA" só aparece no modo IA; no modo Manual aparece "Confirmar Caso"

### Sem mudanças no backend
O edge function `professor-simulado` já recebe `case_prompt` como JSON genérico — o formato manual será idêntico ao gerado pela IA, então nenhuma alteração é necessária no backend.

