

# Plano: Integrar Método Feynman ao Tutor IA

## Conceito
Adicionar um modo "Feynman" ao fluxo de estudo onde, após o conteúdo teórico, o sistema pede ao aluno que explique o conceito com suas próprias palavras. A IA então avalia a explicação, identifica lacunas e dá feedback — antes de passar para questões de Active Recall.

## Implementação

### 1. Novo agente "Método Feynman" no AgentsHub
- Página dedicada `src/pages/FeynmanTrainer.tsx` com `AgentChat`
- Quick actions: "Explicar um tema", "Avaliar minha explicação", "Simplificar conceito"
- Rota: `/dashboard/feynman`

### 2. Edge Function `supabase/functions/feynman-trainer/index.ts`
- System prompt específico que:
  - Pede ao aluno para explicar um conceito como se fosse para um leigo
  - Avalia a explicação em 4 critérios: Clareza, Completude, Precisão, Simplicidade
  - Identifica gaps ("Você não mencionou X, que é crucial porque...")
  - Pede reformulação das partes fracas
  - Dá score visual (ex: ⭐⭐⭐⭐☆)
- Usa `enazizi-prompt.ts` como base + PubMed enrichment

### 3. Integração ao fluxo do Tutor IA (opcional, fase 2)
- No `study-session`, após bloco teórico, inserir prompt Feynman antes do Active Recall
- Fluxo: Teoria → "Explique com suas palavras" → Feedback → Questão

### 4. Sidebar e rotas
- Adicionar entrada no `DashboardSidebar.tsx` e `BottomTabBar.tsx`
- Adicionar rota lazy em `App.tsx`

## Arquivos
- Criar: `src/pages/FeynmanTrainer.tsx`
- Criar + deploy: `supabase/functions/feynman-trainer/index.ts`
- Editar: `src/App.tsx` (rota), `src/components/layout/DashboardSidebar.tsx`, `src/pages/AgentsHub.tsx`

