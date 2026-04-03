

# Flashcards com Apresentação Estilo Simulado

## Problema
O módulo Flashcards tem uma UI artesanal (card flip, input de texto, botões soltos) bem diferente do Simulados que tem: header sticky com progresso, grid de navegação, flags, barra de progresso, layout profissional e consistente.

## Solução
Criar um componente `FlashcardExam` que replica a estrutura visual do `SimuladoExam` mas adaptado para flashcards (flip, avaliação FSRS em vez de MCQ). Manter toda a lógica de FSRS, XP, error_bank, etc.

## Arquitetura

```text
Flashcards.tsx (setup/empty/loading — simplificado)
  │
  ├─ Tela inicial: escolha modo (Revisão / Todos / Sprint) + filtro tema + Iniciar
  │
  └─ FlashcardExam.tsx (novo componente, estilo SimuladoExam)
       ├─ Header sticky: contador, progresso, tempo (sprint)
       ├─ Barra de progresso
       ├─ Card: topic badge + flag + enunciado + flip + resposta
       ├─ Botões FSRS: Errei / Bom / Fácil
       ├─ Navegação: Anterior / Próxima / Finalizar
       └─ Grid de navegação (verde=acertou, vermelho=errou, cinza=pendente)
```

## Mudanças

### 1. Criar `src/components/flashcards/FlashcardExam.tsx`
Componente inspirado no `SimuladoExam`:
- **Header sticky**: `{idx+1}/{total}` | acertos/erros (contadores) | tempo restante (sprint)
- **Barra de progresso**: baseada em cards revisados
- **Card principal**: glass-card com topic badge, botão flag, pergunta visível, área de resposta oculta
- **Input de resposta** + botão "Responder" ou "Pular" (mostra resposta)
- **Após flip**: feedback visual (acerto/erro), botões FSRS (Errei/Bom/Fácil), botão "Aprofundar com Tutor IA"
- **Navegação**: Anterior / Próxima com setas
- **Grid de navegação** no rodapé: quadrados coloridos por status (pendente, acertou, errou, atual, flagged)
- Props: `cards`, `fsrsStates`, `mode`, `sprintConfig?`, `onReview`, `onFinish`, `onDelete`

### 2. Simplificar `src/pages/Flashcards.tsx`
- Adicionar fase `"setup" | "active" | "finished"`
- Fase **setup**: tela limpa com escolha de modo + filtro de temas + botão "Iniciar Revisão" (estilo SimuladoSetup)
- Fase **active**: renderiza `<FlashcardExam />`
- Fase **finished**: tela de resultado com estatísticas da sessão (acertos, erros, taxa, tempo)
- Mover toda a lógica de review/delete/sprint para callbacks passados ao componente
- Remover o bloco de UI inline (linhas 340-620)

### 3. Tela de resultado (`FlashcardResult`)
- Inline no próprio Flashcards.tsx ou componente separado
- Mostra: total revisados, acertos, erros, taxa %, temas com mais erros
- Botões: "Nova Sessão" / "Voltar ao Dashboard"

| Arquivo | Ação |
|---------|------|
| `src/components/flashcards/FlashcardExam.tsx` | Criar — componente principal estilo simulado |
| `src/pages/Flashcards.tsx` | Refatorar — setup → exam → result |

