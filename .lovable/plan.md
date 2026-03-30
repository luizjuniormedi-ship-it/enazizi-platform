

# Enriquecer Respostas de Exame Físico Durante a Simulação do Plantão

## Situação Atual

Quando o aluno pede exame físico durante o Plantão, o sistema descreve achados como narrador clínico, mas **sem estrutura semiológica formal** -- não nomeia manobras específicas, não descreve a técnica de execução nem a interpretação do achado.

Os achados estruturados com manobras só aparecem **no final** (campo `physical_exam_expected`).

## Proposta

Modificar o prompt do sistema para que, **durante a simulação** (action="interact", response_type="physical_exam"), a IA:

1. Nomeie as **manobras semiológicas** realizadas (ex: "Sinal de Blumberg", "Manobra de Giordano")
2. Descreva a **técnica** brevemente (ex: "descompressão brusca do abdome")
3. Informe o **achado** (positivo ou negativo) com significado clínico
4. Sugira **próximas manobras** relevantes que o aluno deveria pedir

## Mudança

### `supabase/functions/clinical-simulation/index.ts`

Na seção "Se o aluno pede EXAME FÍSICO" (linhas 88-92), adicionar instrução:

```text
* Ao descrever os achados, SEMPRE inclua:
  - Nome técnico da manobra semiológica realizada
  - Breve descrição da técnica de execução
  - Achado encontrado (positivo ou negativo) e seu significado clínico
  - Sugestão de manobras complementares que o aluno poderia solicitar
  Exemplo: "Ao realizar a Manobra de Blumberg (descompressão brusca do abdome), 
  observa-se dor intensa à descompressão em FID → sugere irritação peritoneal. 
  Considere também avaliar o Sinal de Rovsing e o Sinal do Psoas."
```

Adicionar ao JSON de resposta (quando `response_type: "physical_exam"`) um campo opcional:

```text
"maneuvers_performed": [
  { "name": "Nome", "technique": "Técnica", "finding": "Achado", "interpretation": "Significado" }
]
```

### `src/pages/ClinicalSimulation.tsx`

Na renderização das mensagens do chat, quando `response_type === "physical_exam"` e existir `maneuvers_performed`, exibir cards visuais com as manobras (ícone de estetoscópio, nome em destaque, técnica e achado).

## Impacto

- 2 arquivos editados
- Zero mudança em rotas ou lógica de negócio
- O aluno aprende manobras semiológicas **em tempo real** enquanto conduz o caso

