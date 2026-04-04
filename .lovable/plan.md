

# Adaptar Sistema Automaticamente ao Mudar Banca/Data no Perfil

## Problema
Quando o aluno edita bancas alvo ou data da prova no perfil, o `handleSave` em `Profile.tsx` salva no banco mas **não invalida os caches** do Dashboard. Resultado: cronograma, metas semanais, chance por banca, Study Engine e missão continuam usando dados antigos até o próximo refresh manual.

## Solução
Após salvar o perfil com sucesso, chamar `invalidateAll()` do `useDashboardInvalidation` para forçar recálculo de todos os hooks dependentes (core-data, study-engine, exam-readiness, weekly-goals, mission-mode) e atualizar o snapshot do dashboard.

## Alteração

### `src/pages/Profile.tsx`
1. Importar `useDashboardInvalidation`
2. Chamar `invalidateAll()` logo após o `toast({ title: "Perfil atualizado!" })` no `handleSave`

Isso garante que:
- `useCoreData` recarrega o perfil atualizado (target_exams, exam_date)
- `useStudyEngine` recalcula recomendações com as novas bancas
- `useExamReadiness` recalcula chance por banca
- `useWeeklyGoals` recalcula metas com nova proximidade da prova
- `useMissionMode` adapta a missão ao novo contexto
- Dashboard snapshot é atualizado em background

## Impacto
- 1 arquivo alterado, ~3 linhas adicionadas
- Zero risco — mesma função já usada em outros fluxos
- Sem alteração de regras de negócio

