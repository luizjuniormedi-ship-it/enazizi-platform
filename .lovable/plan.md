

## Plano: Habilitar Upload no Gerador de Questões

### O que muda

**Arquivo: `src/pages/QuestionGenerator.tsx`**

Adicionar duas props ao componente `AgentChat`:

1. `showUploadButton` — exibe o botão de upload na interface do chat
2. `autoPromptAfterUpload` — após o upload ser processado, envia automaticamente um prompt pedindo questões baseadas no conteúdo do material

### Detalhes técnicos

- O componente `AgentChat` já possui toda a lógica de upload (envio ao storage, processamento via edge function, extração de conteúdo e injeção como contexto). Basta ativar as props.
- A edge function `question-generator` já recebe e utiliza `userContext` de materiais enviados. Nenhuma alteração no backend é necessária.
- Mudança de apenas 2 linhas no arquivo `QuestionGenerator.tsx`.

