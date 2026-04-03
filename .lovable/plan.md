

# Integrar Perfil de Banca e Dados do Aluno ao Modo Plantão

## Situação Atual
O Modo Plantão já implementa tudo que o prompt descreve: apresentação do paciente, etapas de diagnóstico/conduta/tratamento adaptativo, feedback final com scores detalhados, adaptação por dificuldade/triage, e deterioração por inatividade. O sistema já tem 2336 linhas de UI e 538 linhas de edge function.

**O que falta**: o sistema não recebe nem usa os dados de banca do aluno (ENARE/USP/SUS-SP/ENAMED), seu histórico de erros, nem a proximidade da prova para adaptar o estilo do caso.

## Mudanças

### 1. Frontend — Enviar dados do perfil ao iniciar caso
**Arquivo**: `src/pages/ClinicalSimulation.tsx`
- No `startSimulation()`, buscar do perfil do usuário: `target_exams` (bancas), erros recentes na especialidade (via `error_bank`), e data da prova
- Enviar esses dados no body da request `action: "start"`:
  - `target_exams: ["enare", "usp"]`
  - `user_level: "intermediário"` (já existe via `difficulty`)
  - `recent_errors: { has_errors: true, error_types: ["diagnóstico", "conduta"] }`
  - `exam_proximity_days: 45`

### 2. Edge Function — Injetar contexto de banca no prompt
**Arquivo**: `supabase/functions/clinical-simulation/index.ts`
- Importar `getBancaProfile` e `buildBancaBlock` de `_shared/banca-profiles.ts`
- No bloco `action === "start"`, adicionar ao prompt do usuário:
  - Bloco de adaptação por banca (estilo, profundidade, ênfases)
  - Informações de erros prévios para reforço
  - Proximidade da prova para aumentar complexidade
- Exemplo de instrução adicionada: "Adapte o estilo do caso para a banca ENARE: direto, objetivo, foco em conduta. O aluno errou recentemente em diagnóstico de cardiologia — inclua pistas que testem esse tipo de raciocínio."

### 3. Lookup de erros no frontend
**Arquivo**: `src/pages/ClinicalSimulation.tsx`
- Antes de chamar a API, fazer query rápida ao `error_bank` filtrando pela especialidade selecionada e pelo user_id
- Extrair tipos de erro predominantes (diagnóstico/conduta/tratamento) e temas
- Passar como `recent_errors` no body

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/ClinicalSimulation.tsx` | Buscar target_exams do perfil + erros recentes, enviar no start |
| `supabase/functions/clinical-simulation/index.ts` | Receber e injetar contexto de banca + erros no prompt de geração |

## O que NÃO muda
- Toda a lógica de interação, ABCDE, deterioração, prescrição, avaliação final
- UI existente permanece intacta
- Nenhuma funcionalidade removida

## Resultado
O Plantão passa a gerar casos adaptados ao perfil real do aluno: estilo da banca, reforço de erros anteriores e pressão proporcional à proximidade da prova.

