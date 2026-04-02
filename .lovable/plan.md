

# Re-atribuir Atividades Após Edição de Perfil do Aluno

## Problema
Quando um aluno corrige seus dados de cadastro (faculdade, período), o CRON `auto-assign-simulados` eventualmente o atribui, mas:
1. Pode demorar até o próximo ciclo do CRON
2. O CRON só cobre simulados — **não cobre casos clínicos nem temas de estudo**
3. Se o aluno já estava com dados errados quando o simulado foi criado, ele ficou de fora

## Solução

### 1. Trigger imediato após salvar perfil (`src/pages/Profile.tsx`)
Após o `update` do perfil, chamar a edge function `auto-assign-simulados` para re-verificar imediatamente:

```typescript
// Após salvar perfil com sucesso
await supabase.functions.invoke("auto-assign-simulados");
```

Mesmo tratamento no `ProtectedRoute.tsx` (tela de completar cadastro).

### 2. Expandir `auto-assign-simulados` para cobrir casos clínicos e temas
Adicionar ao CRON a mesma lógica para `teacher_clinical_cases` → `teacher_clinical_case_results` e `teacher_study_assignments` → `teacher_study_assignment_results`, usando os mesmos filtros de `faculdade_filter` e `periodo_filter`.

### 3. Lógica de atribuição expandida

Para **casos clínicos**:
- Buscar `teacher_clinical_cases` com `status = 'published'`
- Encontrar alunos que correspondam aos filtros e ainda não tenham resultado
- Inserir em `teacher_clinical_case_results` com `status: 'pending'`

Para **temas de estudo**:
- Buscar `teacher_study_assignments` com `status = 'published'`
- Encontrar alunos correspondentes sem resultado
- Inserir em `teacher_study_assignment_results` com `status: 'pending'`

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/auto-assign-simulados/index.ts` | Expandir para auto-atribuir também casos clínicos e temas de estudo |
| `src/pages/Profile.tsx` | Chamar `auto-assign-simulados` após salvar perfil |
| `src/components/auth/ProtectedRoute.tsx` | Chamar `auto-assign-simulados` após completar cadastro |

