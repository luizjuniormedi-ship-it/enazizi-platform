

# Bloqueio por Atividades Pendentes na Proficiência

## Objetivo

Quando o aluno tiver atividades atribuídas pelo professor (simulados, casos clínicos ou temas de estudo) com status `pending`, ele será obrigado a visitar a aba **Proficiência** antes de acessar qualquer outro módulo. Após visitar, o bloqueio é liberado para a sessão atual.

## Arquitetura

```text
┌─────────────────────────────────────┐
│  usePendingProficiency (hook)       │
│  - Consulta 3 tabelas de results   │
│  - Retorna hasPending + count       │
│  - Gerencia "já visitou" via state  │
└──────────────┬──────────────────────┘
               │
     ┌─────────▼──────────┐
     │  ProficiencyGate   │
     │  (componente)      │
     │  - Modal bloqueante│
     │  - Botão → navega  │
     └────────────────────┘
               │
     ┌─────────▼──────────┐
     │  DashboardLayout   │
     │  - Renderiza Gate  │
     │  antes do <Outlet> │
     └────────────────────┘
```

## Mudanças

### 1. Novo hook: `src/hooks/usePendingProficiency.ts`

- Consulta `teacher_simulado_results`, `teacher_clinical_case_results` e `teacher_study_assignment_results` onde `student_id = user.id` e `status = 'pending'`
- Retorna `{ hasPending, pendingCount, hasVisited, markVisited }`
- `hasVisited` começa `false` e vira `true` quando o aluno visita `/dashboard/proficiencia` (armazenado em `sessionStorage` para durar apenas a sessão)
- `isBlocked = hasPending && !hasVisited`

### 2. Novo componente: `src/components/dashboard/ProficiencyGate.tsx`

- Usa o hook acima
- Se `isBlocked`, renderiza um overlay fixo (z-50) com:
  - Ícone de GraduationCap
  - Mensagem: "Você tem X atividades pendentes do professor"
  - Botão "Ir para Proficiência" → navega para `/dashboard/proficiencia`
- Se não bloqueado, renderiza `null`

### 3. `src/components/layout/DashboardLayout.tsx`

- Importar e renderizar `<ProficiencyGate />` dentro do `<main>`, antes do `<Outlet />`
- O gate NÃO aparece quando a rota atual já é `/dashboard/proficiencia`

### 4. `src/pages/StudentSimulados.tsx` (Proficiência)

- No `useEffect` de carregamento, chamar `markVisited()` do hook para liberar o bloqueio na sessão
- Isso garante que basta o aluno abrir a página para ser desbloqueado

## Detalhes técnicos

- **sessionStorage** com chave `proficiency-gate-visited` — reseta quando o aluno fecha o navegador, forçando nova verificação na próxima sessão
- **React Query** com `staleTime: 5min` para não sobrecarregar o banco
- O overlay bloqueia interação com o conteúdo abaixo (pointer-events) mas mantém sidebar/header visíveis para navegação à Proficiência
- Também preciso corrigir o erro de build do ProfessorDashboard que está impedindo o carregamento

