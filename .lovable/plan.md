

# Anamnese: Sidebar + Hipótese Diagnóstica e Conduta

## Problemas identificados
1. A rota `/dashboard/anamnese` não está no sidebar
2. O fluxo atual termina na anamnese pura -- falta a etapa onde o aluno propõe **hipótese diagnóstica** e **conduta** baseados na anamnese coletada
3. A avaliação final precisa incluir análise da HD e conduta propostas

## Mudanças

### 1. Sidebar -- adicionar link da Anamnese
Adicionar no grupo "Avaliação" do `DashboardSidebar.tsx`:
```
{ to: "/dashboard/anamnese", icon: MessageCircle, label: "🩺 Anamnese" }
```

### 2. Nova fase no fluxo: "diagnosis" (entre "active" e "finishing")
Após o aluno clicar "Finalizar Anamnese", em vez de ir direto para avaliação, abre uma tela intermediária onde o aluno preenche:
- **Hipótese Diagnóstica Principal** (texto livre)
- **Diagnósticos Diferenciais** (até 3, texto livre)
- **Conduta Proposta** (texto livre -- exames, tratamento, encaminhamento)

Só então o aluno clica "Enviar para Avaliação" e a IA recebe tudo junto.

### 3. Edge Function -- atualizar prompt do `finish`
Expandir a action `finish` para receber os campos `hypothesis`, `differentials`, `proposed_conduct` e avaliar:
- **hypothesis**: { score: 0-15, correct: true/false, feedback }
- **differentials**: { score: 0-10, relevant_count, feedback }
- **conduct**: { score: 0-15, appropriate: true/false, feedback }
- Incluir na resposta `correct_diagnosis`, `ideal_conduct`, `diagnostic_reasoning`

A pontuação total passa a considerar essas 3 novas categorias (anamnese ~60pts + HD/Diferenciais/Conduta ~40pts).

### 4. Frontend -- AnamnesisTrainer.tsx
- Novo `Phase`: `"lobby" | "active" | "diagnosis" | "finishing" | "result"`
- Nova tela "diagnosis": Card com 3 textareas (HD principal, diferenciais, conduta)
- Tela de resultado expandida com seções para avaliação da HD e conduta
- Checklist lateral ganha 3 novas categorias visuais: HD, Diferenciais, Conduta

### 5. Banco de dados
Sem mudanças -- os campos `categories_covered` (jsonb) e `conversation_history` (jsonb) da tabela `anamnesis_results` já comportam os novos dados.

## Resumo de arquivos alterados
1. `src/components/layout/DashboardSidebar.tsx` -- adicionar link Anamnese
2. `supabase/functions/anamnesis-trainer/index.ts` -- expandir prompt finish com HD/conduta
3. `src/pages/AnamnesisTrainer.tsx` -- nova fase "diagnosis", tela de input HD/conduta, resultado expandido

