# Múltiplas Provas Alvo (até 3)

## 1. Migração de Banco de Dados
- Adicionar coluna `target_exams text[]` na tabela `profiles`
- Migrar dados existentes: copiar `target_exam` para `target_exams` como array de 1 elemento
- Manter `target_exam` temporariamente para retrocompatibilidade (não remover)

## 2. Onboarding (`OnboardingV2Flow.tsx`)
- Trocar `Select` por grid de checkboxes com limite de 3
- Estado muda de `string` para `string[]`
- Salvar em `target_exams` (array) + `target_exam` (primeiro da lista, para compatibilidade)
- UI: badges selecionáveis com contador "X/3 selecionadas"

## 3. Perfil (`Profile.tsx`)
- Adicionar campo de seleção múltipla de provas (mesmo padrão do onboarding)
- Carregar e salvar `target_exams`

## 4. Study Engine (`studyEngine.ts`)
- Ler `target_exams` do perfil
- Para múltiplas provas: combinar os `ExamProfile` (média ponderada dos modifiers)
- Nova função `getMergedExamProfile(exams: string[])` em `examProfiles.ts`

## 5. Edge Function (`generate-study-plan`)
- Ler `target_exams` do perfil
- Combinar perfis de banca para gerar plano equilibrado

## 6. Study Session (`StudySession.tsx`)
- Ler `target_exams` em vez de `target_exam`

## 7. Dashboard
- Exibir badges com as provas selecionadas (ex: "USP • ENARE • SUS-SP")

## Arquivos afetados
| Arquivo | Ação |
|---------|------|
| Migração SQL | Adicionar coluna `target_exams text[]` |
| `src/components/onboarding/OnboardingV2Flow.tsx` | Seleção múltipla (checkboxes) |
| `src/pages/Profile.tsx` | Seleção múltipla de provas |
| `src/lib/examProfiles.ts` | Nova função `getMergedExamProfile` |
| `src/lib/studyEngine.ts` | Usar `target_exams` + merge de perfis |
| `src/pages/StudySession.tsx` | Ler `target_exams` |
| `supabase/functions/generate-study-plan/index.ts` | Ler `target_exams` |
| `src/components/dashboard/ExamSetupReminder.tsx` | Exibir múltiplas provas |
