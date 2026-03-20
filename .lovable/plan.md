

# Ideia Melhor: Empty States Inteligentes + Botão "Como Usar"

## Por que o botão sozinho não é ideal

Um botão "Como usar" é útil, mas o aluno precisa **saber que precisa de ajuda** para clicar nele. O momento em que o aluno mais precisa de orientação é quando **entra num módulo pela primeira vez e não tem dados** — tela vazia, sem saber o que fazer.

## Proposta: Duas camadas complementares

### Camada 1 — Empty States com instruções e CTAs (automático)
Quando o módulo não tem dados ainda (zero flashcards, zero temas no cronograma, zero questões respondidas), em vez de mostrar uma tela vazia, exibir um card ilustrado com:
- Título: "Como começar"
- 3 passos numerados explicando o que fazer
- **Botões de ação diretos** que executam o primeiro passo (ex: "Gerar Flashcards", "Adicionar Tema", "Iniciar Simulado")

Exemplo no Flashcards:
```text
┌─────────────────────────────────┐
│  📚  Seus Flashcards            │
│                                 │
│  Ainda não tem flashcards.      │
│  Veja como começar:             │
│                                 │
│  1. Vá em "Gerar Flashcards"    │
│  2. Escolha um tema médico      │
│  3. Revise marcando Fácil/Difícil│
│     O algoritmo agenda revisões │
│                                 │
│  [🚀 Gerar Flashcards Agora]   │
└─────────────────────────────────┘
```

Isso **desaparece sozinho** quando o aluno tem dados — sem poluir a interface.

### Camada 2 — Botão "Como usar" destacado (permanente)
Para quando o aluno já tem dados mas esqueceu alguma funcionalidade. O botão com `HelpCircle` + "Como usar" + badge pulsante na primeira visita, conforme já planejado.

## Alterações técnicas

### 1. Novo: `src/components/layout/ModuleEmptyState.tsx`
- Props: `title`, `steps: string[]`, `actionLabel`, `actionPath`
- Card visual com gradiente, ícone, passos numerados e botão CTA
- Reutilizável em qualquer módulo

### 2. Novo: `src/components/layout/ModuleHelpButton.tsx`
- Botão destacado com `HelpCircle` + "Como usar"
- Badge pulsante na primeira visita (localStorage)
- Popover com passos numerados

### 3. Atualizar: `SystemGuidePopup.tsx`
- Cards clicáveis com `howTo` expandível

### 4. Integrar em 10 módulos
- Empty state: exibir quando não há dados (condicional simples)
- Help button: sempre visível no header

### Arquivos
- `src/components/layout/ModuleEmptyState.tsx` (novo)
- `src/components/layout/ModuleHelpButton.tsx` (novo)
- `src/components/dashboard/SystemGuidePopup.tsx` (update)
- 10 páginas de módulos (adição dos dois componentes)

