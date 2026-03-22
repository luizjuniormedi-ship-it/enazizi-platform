

# Plano: Critérios Clínicos Realistas para Deterioração no Modo Real

## Problema
Atualmente, o prompt de deterioração é genérico: simplesmente diz "piore os sinais vitais". Isso pode gerar situações absurdas como um paciente com tosse simples evoluindo para parada cardíaca, quebrando o realismo e prejudicando o aprendizado.

## Solução
Atualizar o prompt de deterioração na edge function para exigir que a piora seja **fisiopatologicamente coerente** com o diagnóstico oculto do caso. A IA deve justificar clinicamente cada piora.

Além disso, corrigir o erro de build existente no `ClinicalSimulation.tsx`.

## Mudanças

### 1. Edge Function — Prompt de Deterioração Realista (`clinical-simulation/index.ts`)
Substituir o bloco de instruções do `action: "deteriorate"` com regras clínicas:

- **Regra principal**: A piora DEVE seguir a fisiopatologia do diagnóstico oculto (`hidden_diagnosis`). Exemplo: pneumonia → piora SpO2 e FR; sepse → hipotensão e taquicardia; fratura → dor e edema, sem alteração hemodinâmica drástica.
- **Proibições explícitas**:
  - Pacientes verde/amarelo NÃO evoluem para parada no nível 1
  - Pacientes com queixa menor (tosse, lombalgia, cefaleia) não devem ter piora hemodinâmica severa nos níveis 1-2
  - A piora deve ser proporcional à classificação de risco inicial (triage_color)
- **Mapa de severidade por triage**:
  - Verde: nível 1 = desconforto leve, nível 2 = piora moderada, nível 3 = complicação plausível (não parada)
  - Amarelo: nível 1 = instabilidade inicial, nível 2 = deterioração, nível 3 = grave mas com chance de reverter
  - Laranja/Vermelho: progressão rápida conforme a doença de base
- **Instrução de narrativa**: Descrever a piora com justificativa clínica ("Devido à falta de antibioticoterapia, o paciente evolui com...")
- **Campo obrigatório na resposta**: `"deterioration_rationale"` — explicação fisiopatológica da piora

### 2. Frontend — Enviar contexto clínico na deterioração (`ClinicalSimulation.tsx`)
- Incluir `triageColor` e `patientStatus` atual no payload enviado para `action: "deteriorate"`, para que a IA tenha contexto da gravidade inicial
- Corrigir o erro de build (TS1128) — identificar e resolver a inconsistência sintática

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/clinical-simulation/index.ts` | Prompt de deterioração reescrito com critérios fisiopatológicos, mapa por triage, proibições de piora irreal |
| `src/pages/ClinicalSimulation.tsx` | Enviar triage_color e patient_status no payload de deterioração; fix build error |

## Detalhes Técnicos
- O `hidden_diagnosis` já está no contexto da conversa (enviado no `conversation_history`), então a IA tem acesso ao diagnóstico correto para piora coerente
- Nenhuma mudança no banco de dados

