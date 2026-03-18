

# Plano: Correção do Gerador de Questões

## Problemas Identificados

Após revisão detalhada do código, identifiquei os seguintes problemas:

### 1. Quick Actions não enviam automaticamente
Ao clicar em um botão rápido (ex: "Cardiologia 10"), o sistema apenas preenche o campo de texto mas **não envia**. O aluno precisa clicar em "Enviar" ou pressionar Enter manualmente. Isso causa confusão.

### 2. Parser de questões interativas pode falhar
O `InteractiveQuestionRenderer` espera o formato `a) b) c) d) e)` no início da linha, mas a IA pode retornar variações como `**a)** opção` ou formatos ligeiramente diferentes, fazendo as questões não renderizarem como cards interativos (ficam como texto puro).

### 3. Toast de auto-save com texto errado
Quando as questões são salvas automaticamente, o toast mostra "flashcard(s) salvo(s)" em vez de "questão(ões) salva(s)" -- confunde o usuário.

## Correções

### Arquivo: `src/components/agents/AgentChat.tsx`
- **Quick actions**: Ao clicar, chamar `handleSend(action.prompt)` diretamente em vez de apenas `setInput()`
- **Toast auto-save**: Corrigir mensagem para "questão(ões) salva(s) no seu banco"

### Arquivo: `src/components/agents/InteractiveQuestionRenderer.tsx`
- Melhorar regex do parser para aceitar variações de formatação: `**a)**`, `A)`, `a. `, markdown bold nas opções
- Melhorar extração do gabarito para aceitar `**Gabarito:** **A**` e variações com asteriscos

### Arquivo: `src/lib/parseQuestions.ts`
- Mesmas melhorias de regex para o parser de salvamento (usado pelo botão "Salvar questões")

