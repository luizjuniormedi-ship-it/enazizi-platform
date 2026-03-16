

## Plano de Melhorias no Sistema de Questões, Simulados, Flashcards e Treinamento

### Problemas Identificados

1. **Simulados (`Simulados.tsx`)**: Usa streaming SSE para gerar questões em JSON, parsing frágil com regex, sem cronômetro, sem salvar no banco, sem relatório por área detalhado, sem dificuldade configurável
2. **ExamSimulator**: Melhor que Simulados mas duplica funcionalidade; busca do banco limitada a `questionCount * 2`; geração AI não usa streaming corretamente (`supabase.functions.invoke` não lê SSE)
3. **Gerador de Questões**: Funcional mas sem seleção de dificuldade nos quick actions, faltam mais especialidades nos atalhos
4. **Flashcards**: Validação semântica básica (40% keywords), sem modo "sprint" cronometrado, sem estatísticas de performance por sessão
5. **Banco de Questões**: Sem modo "simulado rápido" a partir de filtros, sem importação de questões externas, sem categorização por dificuldade
6. **InteractiveQuestionCard**: Não registra `practice_attempts` no banco (só loga no error_bank), não dá XP
7. **Integração entre módulos**: Erros do Gerador de Questões interativo não alimentam `medical_domain_map`

---

### Melhorias Planejadas

#### 1. Unificar e Melhorar o Simulados
- Adicionar **seleção de dificuldade** (Fácil/Intermediário/Difícil/Misto) na tela de setup
- Adicionar **cronômetro** com tempo por questão configurável
- **Salvar sessão** no `exam_sessions` com resultados detalhados
- Melhorar relatório final com **gráfico por área** e **caderno de erros** (como o ExamSimulator já tem)
- Corrigir parsing de JSON: usar `stream: false` para simulados (JSON puro é mais confiável)
- Adicionar **XP e gamificação** ao completar
- Log de erros no `error_bank` e `practice_attempts`

#### 2. Melhorar ExamSimulator
- Corrigir a chamada `supabase.functions.invoke` que não suporta SSE — usar `stream: false` no body ou fazer fetch direto
- Aumentar o pool de busca do banco: `limit(1000)` e filtrar por áreas selecionadas
- Adicionar **modo revisão de erros**: ao final, botão para estudar cada erro com Tutor IA
- Adicionar filtro de **dificuldade** no setup

#### 3. Melhorar InteractiveQuestionCard
- Salvar `practice_attempts` no banco quando o usuário responde dentro do chat
- Dar **XP** por questão respondida/acertada
- Adicionar botão **"Estudar com Tutor"** quando errar (como já existe no QuestionsBank)

#### 4. Melhorar Gerador de Questões
- Expandir `quickActions` com mais especialidades: GO, Preventiva, Emergência, Endocrinologia, Reumatologia, Psiquiatria, Hematologia
- Adicionar **seletor de dificuldade** como quick action
- Adicionar **seletor de quantidade** (5, 10, 15, 20)

#### 5. Melhorar Flashcards
- Adicionar **modo sprint**: revisar X cards em Y minutos com cronômetro
- Melhorar validação semântica: considerar sinônimos médicos comuns
- Adicionar **estatísticas da sessão** ao final (acertos/erros/tempo)
- XP por sessão de flashcards concluída

#### 6. Melhorar Banco de Questões
- Adicionar filtro por **dificuldade**
- Adicionar **modo simulado rápido**: gera simulado cronometrado a partir das questões filtradas
- Botão **"Gerar mais questões deste tema"** que redireciona ao Gerador

#### 7. Melhorar Edge Function `question-generator`
- Adicionar parâmetro `difficulty` ao body para controlar nível
- Quando `stream: false`, retornar resposta completa (não SSE) para simulados
- Aumentar `max_tokens` para 16384 (já está) mas adicionar instrução de completar todas as questões

---

### Arquivos a Editar

| Arquivo | Mudança |
|---|---|
| `src/pages/Simulados.tsx` | Cronômetro, dificuldade, salvar sessão, XP, relatório melhorado |
| `src/pages/ExamSimulator.tsx` | Fix fetch, pool maior, dificuldade, revisão de erros |
| `src/components/agents/InteractiveQuestionCard.tsx` | Salvar attempts, XP, botão tutor |
| `src/pages/QuestionGenerator.tsx` | Mais quick actions, dificuldade |
| `src/pages/Flashcards.tsx` | Modo sprint, stats de sessão |
| `src/pages/QuestionsBank.tsx` | Filtro dificuldade, simulado rápido |
| `src/pages/FlashcardGenerator.tsx` | Mais quick actions |
| `supabase/functions/question-generator/index.ts` | Suporte a `difficulty` e `stream` params |

### Prioridade de Implementação
1. InteractiveQuestionCard (XP + attempts) — impacto em todos os módulos
2. Simulados + ExamSimulator (unificar qualidade)
3. QuestionGenerator + quick actions expandidos
4. Flashcards (sprint mode + stats)
5. QuestionsBank (filtros + simulado rápido)

