

# Plano: Eliminar Sobreposição de Botões nos Headers de Todos os Módulos

## Problema
Na viewport ~1020px (tamanho atual do preview), os botões do header dos módulos se sobrepõem porque há muitos elementos visíveis simultaneamente, mesmo após a adição do dropdown. O espaço disponível é limitado pelo sidebar à esquerda.

## Estratégia
Reduzir agressivamente o número de botões visíveis. Em telas menores que `md` (768px), manter apenas 2 botões: Fullscreen + Dropdown (⋮). Todos os outros vão para dentro do dropdown. Em telas `md+`, permitir até 3 botões visíveis.

## Mudanças

### 1. `src/pages/ChatGPT.tsx`
- Mover **ModuleHelpButton** para dentro do DropdownMenu como item "Como usar"
- Mover **Finalizar** para dentro do dropdown (com estilo destructive)
- Header fica: `[Título] ........... [Tela cheia] [⋮]`
- Dropdown contém: Finalizar, Nova sessão, Histórico, Como usar

### 2. `src/pages/Flashcards.tsx`
- Mover **ModuleHelpButton** para dentro do dropdown
- Mover **botões Revisão/Todos** para dentro do dropdown como items com checkmark
- Header fica: `[Título + stats] ........... [Tela cheia] [⋮]`
- Dropdown contém: Revisão, Todos, Filtrar temas, Sprint, Exportar PDF, Como usar

### 3. `src/pages/StudySession.tsx`
- Mover **fase/progresso** e **Novo** para dentro de um dropdown (adicionar MoreVertical)
- Header fica: `[Sidebar toggle] [Título] ........... [Tela cheia] [⋮]`
- Dropdown contém: Fase atual, Novo, info de progresso

### 4. `src/pages/ClinicalSimulation.tsx`
- Header já é enxuto (Fullscreen + Encerrar) — apenas esconder texto "Encerrar Plantão" em telas pequenas, manter só ícone

### 5. `src/pages/AnamnesisTrainer.tsx` e `src/pages/ExamSimulator.tsx`
- Headers já são simples — sem mudança necessária

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ChatGPT.tsx` | ModuleHelp + Finalizar → dropdown |
| `src/pages/Flashcards.tsx` | ModuleHelp + mode toggles → dropdown |
| `src/pages/StudySession.tsx` | Adicionar dropdown com Novo + fase |
| `src/pages/ClinicalSimulation.tsx` | Esconder label "Encerrar Plantão" em telas < sm |

