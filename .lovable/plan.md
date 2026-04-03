
# Modo Prova Prática (OSCE) no ENAZIZI

## Visão Geral

Criar um modo "Prova Prática" que reutiliza a infraestrutura existente de `ClinicalSimulation` (Plantão) e `AnamnesisTrainer`, adicionando pressão de tempo, avaliação estruturada (0-10) e registro de resultados.

## Arquitetura

```text
Dashboard (PracticalTrainingCard)
  │
  ├─ Modo Normal (Plantão/Anamnese) → já existe
  │
  └─ Modo Prova Prática (novo)
       │
       ├─ Setup: escolha especialidade + dificuldade
       ├─ Execução: caso clínico com timer por decisão (30-90s)
       ├─ Etapas: Anamnese → Exame → Diagnóstico → Conduta
       ├─ Avaliação: nota 0-10 por critério
       └─ Resultado: feedback detalhado + registro no banco
```

## Implementação

### 1. Edge Function: `practical-exam` (nova)
- Gera caso clínico estruturado em múltiplas etapas (anamnese, exame físico, exames complementares, diagnóstico, conduta)
- Avalia cada decisão do aluno com score parcial
- Gera feedback final com nota 0-10 por critério (raciocínio, conduta, priorização, tempo)
- Usa Lovable AI (Gemini 2.5 Flash)

### 2. Tabela: `practical_exam_results` (nova)
- `user_id`, `specialty`, `difficulty`, `case_summary`, `scores_json` (raciocínio, conduta, priorização, tempo), `final_score`, `feedback_json`, `time_total_seconds`, `steps_json`, `created_at`
- RLS: usuário lê/escreve próprios resultados, admin lê todos

### 3. Página: `PracticalExam.tsx` (nova rota `/dashboard/prova-pratica`)
- Tela de setup: especialidade + dificuldade
- Execução: apresentação do caso → decisões com timer visível → múltiplas etapas
- Resultado: nota por critério + feedback + ações (revisar no Tutor, repetir)

### 4. Integrações
- `PracticalTrainingCard`: adicionar botão "Simulação de Prova"
- `StudyEngine`: recomendar quando erro de conduta ou prova próxima
- Rota no `App.tsx`

## Mudanças

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/practical-exam/index.ts` | Nova edge function para geração e avaliação |
| Migração DB | Tabela `practical_exam_results` com RLS |
| `src/pages/PracticalExam.tsx` | Nova página com setup + execução + resultado |
| `src/App.tsx` | Nova rota `/dashboard/prova-pratica` |
| `src/components/dashboard/PracticalTrainingCard.tsx` | Adicionar link para prova prática |
