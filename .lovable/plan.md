

# Plano: Unificar Visibilidade das Atividades do Dia

## Problema
Dois cards (HeroStudyCard + TodayStudyCard) mostram as mesmas tarefas do Study Engine de formas diferentes, gerando confusão.

## Solução

### 1. Remover TodayStudyCard do Dashboard
- Remover o componente `TodayStudyCard` da página do Dashboard
- Toda a informação já está no HeroStudyCard

### 2. Melhorar o HeroStudyCard para mostrar tarefas visíveis sem clique
- As primeiras 3 tarefas ficam **sempre visíveis** (sem precisar expandir)
- Cada tarefa mostra: emoji do tipo + nome do tema + tempo estimado
- O botão "Ver detalhes" mostra as restantes (se houver mais de 3)
- Isso resolve o problema: o aluno abre o app e **imediatamente vê o que tem que fazer**

### 3. Resultado visual no mobile (430px)

```text
┌─────────────────────────────┐
│  ✨ Sua missão de hoje      │
│  Cardiologia · ~45min       │
│                             │
│  [■■■ COMEÇAR ESTUDO ■■■]   │
│  [🔥 Modo Foco Total      ] │
│                             │
│  🔄 2 revisões  📝 3 quest. │
│─────────────────────────────│
│  🔄 Revisão — Cardiologia   │  ← sempre visível
│  ❌ Correção — Pneumologia  │  ← sempre visível  
│  📝 Questões — Nefrologia   │  ← sempre visível
│  ▼ Ver mais (2 tarefas)     │
└─────────────────────────────┘
```

## Arquivos a alterar

1. **`src/components/dashboard/HeroStudyCard.tsx`** — mostrar 3 tarefas sempre visíveis, expandir para ver o resto
2. **Página do Dashboard** — remover uso do `TodayStudyCard`

## O que NÃO muda
- Lógica do Study Engine
- Modo Missão
- Navegação lateral
- Nenhum dado ou backend

