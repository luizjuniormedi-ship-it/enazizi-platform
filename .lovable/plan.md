

## Plano: Padronizar respostas do Resumidor + Botão "Pedir explicação ao Tutor"

### Problema
1. O Resumidor usa um prompt próprio com estrutura diferente do Tutor (ENAZIZI_PROMPT)
2. Não existe forma de levar o resumo gerado para o Tutor para continuar a explicação

### Alterações

**1. Atualizar o prompt do Resumidor** (`supabase/functions/content-summarizer/index.ts`)
- Substituir o prompt customizado atual pelo `ENAZIZI_PROMPT` importado de `_shared/enazizi-prompt.ts`
- Adicionar apenas um prefixo curto instruindo que o foco é gerar resumos estruturados, mas seguindo a mesma organização visual e pedagógica do Tutor
- Manter as regras de escopo médico e a integração com `userContext`

**2. Adicionar botão "Pedir explicação ao Tutor"** (`src/components/agents/AgentChat.tsx`)
- Adicionar uma nova prop opcional `linkToAgent?: { label: string; path: string; buildPrompt: (content: string) => string }`
- Em cada mensagem do assistente (após o conteúdo), renderizar um botão com ícone que navega para a página do Tutor passando o resumo como estado via `useNavigate`

**3. Configurar o botão na página do Resumidor** (`src/pages/ContentSummarizer.tsx`)
- Passar a prop `linkToAgent` apontando para `/tutor` (ou a rota do ChatGPT/Tutor)
- O prompt enviado será algo como: "Com base neste resumo, continue a explicação aprofundada: [resumo]"

**4. Receber contexto no Tutor** (`src/pages/ChatGPT.tsx`)
- Usar `useLocation` para verificar se há estado (`location.state?.fromSummary`)
- Se houver, disparar automaticamente uma mensagem com o resumo como contexto

### Detalhes técnicos

- Navegação via `react-router-dom` `useNavigate` com `state`
- O botão aparece apenas em mensagens do assistente que não estejam em loading
- O resumo é truncado a ~10000 caracteres para não exceder limites do prompt
- O `content-summarizer` passará a importar `ENAZIZI_PROMPT` e adicionar instruções de resumo como complemento

