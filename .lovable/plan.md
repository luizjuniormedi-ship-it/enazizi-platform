

# Plano: Implementar Melhorias Restantes no Tutor IA (Mantendo Blocos)

Os blocos de ensino, fisiopatologia profunda e eventos adversos já estão implementados. Agora implemento as 5 melhorias estruturais restantes.

## Mudanças

### 1. Active Recall Sequencial (`study-session/index.ts`)

Alterar phase `active-recall` para fazer **1 pergunta por vez** em vez de listar 5-7 de uma vez:
- Primeira chamada: enviar apenas 1 pergunta
- Após resposta do aluno: corrigir + enviar próxima
- Manter contagem (Pergunta 1/5, 2/5...)
- Ao final: resumo de acertos/erros

### 2. Reduzir Densidade das Mensagens (`enazizi-prompt.ts`)

Reestruturar sequência de entrega em **4 mensagens** (em vez de 3):

```text
Msg 1: 💡 EXPLICAÇÃO PARA LEIGO + 🔬 FISIOPATOLOGIA (máx 600 palavras)
Msg 2: 🔬 EXPLICAÇÃO TÉCNICA + 🏥 APLICAÇÃO CLÍNICA
Msg 3: 💊 CONDUTA + 💊⚠️ EVENTOS ADVERSOS + 🔀 DIFERENCIAIS
Msg 4: ⚠️ PEGADINHAS + 🧠 MNEMÔNICO + 📋 RESUMO + 📚 REFS + 🔬 ARTIGOS → ❓ ACTIVE RECALL
```

Reduzir limite de 800-1200 para **500-700 palavras** por mensagem.

### 3. Carregar Performance Real do Banco (`StudySession.tsx`)

Substituir dados mock/localStorage por consultas reais:
- `practice_attempts` → total questões e acertos
- `medical_domain_map` → scores por especialidade
- `error_bank` → temas fracos
- Enviar como `performanceData` na chamada da edge function

### 4. Registrar Respostas como Practice Attempts (`StudySession.tsx`)

Detectar quando o aluno responde A/B/C/D/E a uma MCQ no chat:
- Parsear resposta do tutor para identificar acerto/erro
- Inserir em `practice_attempts` e atualizar `medical_domain_map`
- Atualizar `error_bank` quando errar

### 5. Adaptação por Nível (`study-session/index.ts`)

Incluir nível do aluno no prompt baseado em `performanceData`:
- **Iniciante** (<30%): linguagem simples, mais exemplos
- **Intermediário** (30-70%): equilíbrio teoria/prática
- **Avançado** (>70%): foco em pegadinhas e casos atípicos

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/_shared/enazizi-prompt.ts` | Sequência 4 mensagens, limite 500-700 palavras |
| `supabase/functions/study-session/index.ts` | Active recall 1-por-vez, adaptação por nível |
| `src/pages/StudySession.tsx` | Performance real do banco, registro de practice_attempts |

