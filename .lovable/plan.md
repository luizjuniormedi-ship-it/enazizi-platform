

# Plano: 6 Melhorias Metodologicas no TutorZizi

## Resumo

Implementar as 6 mudancas pedagogicas no prompt base e nos prompts de fase do study-session, sem alterar a interface do usuario.

## Mudancas

### 1. Ensino por Contraste (enazizi-prompt.ts)
Inserir nova secao "ENSINO POR CONTRASTE" apos a secao "METODOLOGIA DE APRENDIZADO" (linha 442), instruindo o tutor a gerar tabelas comparativas automaticas para diagnosticos diferenciais sempre que o tema envolver condicoes clinicamente confundiveis (ex: Crohn vs RCU, IAM vs angina instavel).

### 2. Ancoragem Clinica Inicial (enazizi-prompt.ts)
Modificar a "SEQUENCIA DE ENTREGA EM 4 MENSAGENS" (linha 77-88) para incluir um mini-caso clinico provocativo de 3 linhas ANTES da Mensagem 1. O tutor abre com: "🏥 CASO GATILHO: [mini-caso de 3 linhas sem resposta]" e so entao inicia a explicacao teorica.

### 3. Active Recall Variado (study-session/index.ts)
Modificar o prompt da fase "active-recall" (linhas 115-141) para instruir variacao obrigatoria de formatos: pergunta aberta, V ou F com justificativa, complete a lacuna, e associacao de colunas — alem das perguntas diretas ja existentes.

### 4. Flash Review Entre Sessoes (study-session/index.ts)
Modificar o prompt da fase "lesson" (linhas 76-113) para incluir instrucao: antes de iniciar o bloco tecnico, apresentar 2-3 perguntas rapidas sobre temas previamente errados (usando weakTopics do performanceData), como "aquecimento" da sessao.

### 5. Feedback Emocional Calibrado (enazizi-prompt.ts)
Inserir nova secao "FEEDBACK EMOCIONAL CALIBRADO" apos "COMPORTAMENTO FINAL" (linha 533), com regras:
- 3+ acertos consecutivos: tom desafiador ("Voce esta voando! Vamos subir o nivel")
- 2+ erros consecutivos: tom encorajador ("Normal errar aqui, vamos revisar juntos")
- Primeiro acerto apos erro: celebracao ("Excelente recuperacao!")

### 6. Resumo Visual de Consolidacao (study-session/index.ts)
Adicionar instrucao ao prompt da fase "scoring" (linhas 217-227) para incluir ao final da correcao um fluxograma textual de consolidacao do tema estudado, usando setas e caixas ASCII.

## Arquivos

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/_shared/enazizi-prompt.ts` | +3 secoes novas (Contraste, Ancoragem, Feedback Emocional) + modificacao da Sequencia de Entrega |
| `supabase/functions/study-session/index.ts` | Modificar prompts das fases lesson, active-recall e scoring |

## Impacto

Todas as mudancas sao no nivel de prompt (instrucoes para a IA). Nenhuma alteracao de interface, banco de dados ou edge function logic. Os 3 agentes que usam o prompt base (TutorZizi, MentorMed, Chat Livre) serao beneficiados pelas mudancas no enazizi-prompt.ts. As mudancas no study-session afetam apenas o fluxo de sessao de estudo estruturado.

