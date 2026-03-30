

# Melhorias Avançadas de Inteligência e Comportamento no ENAZIZI

## Visão Geral

Adicionar 7 camadas de inteligência ao sistema existente sem alterar contratos de edge functions, rotas ou lógica de negócio. As melhorias se dividem em: memória de sessão, controle de profundidade, detecção de travamento/padrão de erro, transparência de decisões e modo foco extremo.

---

## Arquitetura das Mudanças

```text
┌─────────────────────────────────────────────┐
│  useSessionMemory (NOVO hook)               │
│  - último tema, última resposta, erros      │
│  - compartilhado via React Context          │
│  - reset após 30min inatividade             │
├─────────────────────────────────────────────┤
│  Prompt Layer (enazizi-prompt.ts)           │
│  + SESSION_MEMORY block                     │
│  + RESPONSE_DEPTH directive                 │
│  + STALL_DETECTION rules                    │
│  + ERROR_PATTERN classification             │
│  + TRANSPARENCY rules                       │
│  + RESPONSE_STRUCTURE standard              │
├─────────────────────────────────────────────┤
│  chatgpt-agent / study-session              │
│  + inject sessionMemory + responseDepth     │
│  + inject consecutiveErrors count           │
├─────────────────────────────────────────────┤
│  FocusHardMode (NOVO componente)            │
│  - ativado por prova próxima / baixa perf   │
│  - sem sidebar, sem navegação lateral       │
└─────────────────────────────────────────────┘
```

---

## Implementação

### 1. Session Memory Context (~novo arquivo)

**Arquivo**: `src/contexts/SessionMemoryContext.tsx`

- React Context + Provider com estado:
  - `lastTopic`, `lastQuestion`, `lastIncorrectAnswer`, `recentDifficulty`, `consecutiveErrors` (por tema), `currentContext`
- Timer de inatividade (30min) que reseta a memória
- Funções: `recordAnswer(topic, correct, question)`, `recordTopicChange(topic)`, `getMemoryPayload()` que retorna objeto serializado para enviar às edge functions
- Provider envolve `DashboardLayout`

### 2. Controle de Profundidade (Response Depth)

**Arquivo**: `src/contexts/SessionMemoryContext.tsx` (dentro do mesmo contexto)

- Função `computeResponseDepth(taskType, consecutiveErrors, isReview)`:
  - `review` ou `error_review` → `"curto"`
  - erro recente no tema → `"medio"`
  - conteúdo novo → `"aprofundado"`
- Retornado como parte de `getMemoryPayload()`

### 3. Atualização do Prompt Base

**Arquivo**: `supabase/functions/_shared/enazizi-prompt.ts`

Adicionar ~120 linhas ao final (antes do LEMBRETE FINAL):

- **MEMÓRIA DE SESSÃO**: Instruções para a IA usar os dados de sessão injetados (último tema, último erro, contexto recente). Exemplos de frases: "Você acabou de errar...", "Vamos reforçar o que vimos agora"
- **CONTROLE DE PROFUNDIDADE**: Diretiva `response_depth` com 3 modos e regras de tamanho (curto: max 300 palavras, médio: max 500, aprofundado: max 700)
- **DETECÇÃO DE TRAVAMENTO**: Se `consecutive_errors >= 3` no mesmo tema, simplificar linguagem, usar analogias, reduzir complexidade. Mensagem obrigatória: "Vamos simplificar isso para fixar melhor."
- **CLASSIFICAÇÃO DE ERRO**: 4 categorias (diagnóstico, conduta, fisiopatologia, interpretação). Quando detectar padrão recorrente, mudar abordagem e focar na raiz
- **TRANSPARÊNCIA**: Sempre iniciar bloco com motivo da escolha do tema (1 linha). Ex: "Estamos reforçando isso porque você errou recentemente"
- **ESTRUTURA PADRÃO DE RESPOSTA**: Todos os blocos seguem: Título claro → Explicação objetiva → Aplicação clínica → Reforço do ponto-chave

### 4. Injeção de Contexto nas Edge Functions

**Arquivo**: `supabase/functions/chatgpt-agent/index.ts`

- Aceitar novo campo `session_memory` no body (opcional)
- Injetar bloco `--- MEMÓRIA DE SESSÃO ---` no prompt com: último tema, último erro, erros consecutivos, profundidade recomendada
- Sem alterar contrato existente (campo opcional, backward-compatible)

**Arquivo**: `supabase/functions/study-session/index.ts`

- Mesma lógica: aceitar `session_memory` e injetar no prompt montado por `getPhasePrompt`

**Arquivo**: `supabase/functions/mentor-chat/index.ts`

- Aceitar `session_memory` e injetar no prompt

### 5. Integração no Tutor IA (ChatGPT.tsx)

**Arquivo**: `src/pages/ChatGPT.tsx`

- Importar `useSessionMemory` do novo contexto
- Após cada resposta da IA (`onComplete`): chamar `recordAnswer(currentTopic, !hasError, questionText)`
- No `sendMessage`: incluir `session_memory: getMemoryPayload()` no body enviado
- Na detecção de erro existente (linhas 253-279): incrementar `consecutiveErrors`

### 6. Modo Foco Extremo (Focus Hard Mode)

**Arquivo**: `src/components/study/FocusHardMode.tsx` (novo)

- Componente fullscreen sem sidebar, sem bottom tab, sem navegação
- Apenas: tarefa atual, timer, botão "Concluir"
- Ativado automaticamente quando:
  - `examDate` <= 15 dias (do profile)
  - `approvalScore` < 40
  - `state.status === "active"` na missão com tarefa crítica

**Arquivo**: `src/pages/MissionMode.tsx`

- Importar `FocusHardMode`
- Quando condições acima são verdadeiras, renderizar `FocusHardMode` em vez do layout padrão
- Usar dados do `useStudyEngine().adaptive` para verificar `approvalScore` e `lockStatus`

### 7. Prioridade Dinâmica Agressiva

**Arquivo**: `src/lib/studyEngine.ts`

- No cálculo de prioridade, adicionar boost de +30 quando:
  - `consecutiveErrors >= 3` para um tema (via `error_bank.vezes_errado`)
  - `approvalScore < 40`
  - Revisão atrasada > 3 dias
- Adicionar regra: se tema tem `vezes_errado >= 5`, não permitir progressão (bloquear novos temas) até acurácia >= 50% nesse tema

---

## Detalhes Técnicos

- **Nenhuma tabela nova** necessária - tudo usa `error_bank`, `enazizi_progress` e `study_sessions` existentes
- **Nenhuma rota nova** - apenas componentes e contexto
- **Backward-compatible** - `session_memory` é campo opcional nas edge functions
- **Sem alteração de contratos** - apenas campos opcionais adicionados ao body

---

## Arquivos Alterados/Criados

| Arquivo | Ação |
|---------|------|
| `src/contexts/SessionMemoryContext.tsx` | Criar |
| `src/components/study/FocusHardMode.tsx` | Criar |
| `supabase/functions/_shared/enazizi-prompt.ts` | Editar (adicionar ~120 linhas) |
| `supabase/functions/chatgpt-agent/index.ts` | Editar (aceitar session_memory) |
| `supabase/functions/study-session/index.ts` | Editar (aceitar session_memory) |
| `supabase/functions/mentor-chat/index.ts` | Editar (aceitar session_memory) |
| `src/pages/ChatGPT.tsx` | Editar (integrar SessionMemory) |
| `src/pages/MissionMode.tsx` | Editar (FocusHardMode condicional) |
| `src/lib/studyEngine.ts` | Editar (prioridade agressiva) |
| `src/components/layout/DashboardLayout.tsx` | Editar (adicionar SessionMemoryProvider) |

