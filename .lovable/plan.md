

# Flashcards: Input de Tema Livre + Geração Automática do Banco Global

## Problema
O filtro de temas usa uma lista de badges baseada nos flashcards existentes, limitando o usuário. O gerador de flashcards depende de chat com IA (AgentChat). Queremos: (1) substituir a lista de badges por um campo de texto livre para digitar o tema, e (2) adicionar geração automática de flashcards a partir do banco global de questões (questions_bank + real_exam_questions), sem depender de IA.

## Solução

### 1. Substituir filtro de badges por input de texto livre (`Flashcards.tsx`)
- Remover o bloco de badges de especialidades (linhas 387-417)
- Adicionar um `<Input>` com placeholder "Digite o tema (ex: Cardiologia, IAM, Pneumonia)"
- Filtrar cards por correspondência parcial no campo `topic` (case-insensitive)
- Manter lógica de `selectedTopics` adaptada para funcionar com texto digitado

### 2. Adicionar botão "Gerar Flashcards do Banco" na tela de setup (`Flashcards.tsx`)
- Novo botão na seção de modos: "Gerar do Banco de Questões"
- Ao clicar, busca questões do banco global (`questions_bank` + `real_exam_questions`) filtradas pelo tema digitado
- Converte cada questão em flashcard: `statement` → pergunta, `explanation + correct option` → resposta
- Insere automaticamente na tabela `flashcards` com `user_id` e `topic`
- Atualiza a lista local sem recarregar a página
- Limite: 20 flashcards por geração (evitar sobrecarga)

### 3. Lógica de conversão questão → flashcard
- **Pergunta**: Enunciado da questão (statement)
- **Resposta**: Alternativa correta + explicação (se houver)
- **Tópico**: Campo `topic` da questão original
- Deduplicação: ignorar questões cujo `statement_hash` (primeiros 80 chars) já existe nos flashcards do usuário

### 4. Atualizar `FlashcardGenerator.tsx`
- Substituir Select de especialidade por Input de texto livre
- Remover CycleFilter
- Manter toda a lógica de AgentChat para geração via IA

| Arquivo | Ação |
|---------|------|
| `src/pages/Flashcards.tsx` | Trocar badges por input + adicionar geração do banco |
| `src/pages/FlashcardGenerator.tsx` | Trocar Select por Input de texto livre |

