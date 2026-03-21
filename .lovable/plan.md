

# Aba de Feedbacks no Painel Admin

## O que será feito

Adicionar uma nova aba "Feedbacks" no painel Admin que exibe todas as avaliações enviadas pelos usuários, com notas por módulo e comentários.

## Plano

### 1. Criar componente `AdminFeedbackPanel`
- Novo arquivo `src/components/admin/AdminFeedbackPanel.tsx`
- Consulta a tabela `user_feedback` com join nos `profiles` para mostrar nome/email do usuário
- Exibe uma lista/tabela com:
  - Nome e email do usuário
  - Data do feedback
  - Notas (estrelas) por módulo em formato visual
  - Texto do feedback
  - Média geral do usuário
- Estatísticas resumidas no topo: total de feedbacks, média geral por módulo, NPS simplificado

### 2. Adicionar aba no Admin
- Em `src/pages/Admin.tsx`, adicionar uma nova `TabsTrigger` "⭐ Feedbacks" e `TabsContent` que renderiza o `AdminFeedbackPanel`

### 3. RLS — garantir acesso admin
- A tabela `user_feedback` precisa de uma policy para admins lerem todos os feedbacks (atualmente provavelmente só tem policy de insert do próprio usuário)
- Migration: adicionar `SELECT` policy para admins usando `has_role(auth.uid(), 'admin')`

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/admin/AdminFeedbackPanel.tsx` | Criar |
| `src/pages/Admin.tsx` | Adicionar aba |
| Migration SQL | RLS policy para admin ler feedbacks |

