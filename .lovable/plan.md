

# BI Diário + Programação do Próximo Dia via WhatsApp

## Resumo
Criar uma opção para cada usuário receber automaticamente no fim do dia (via WhatsApp) um resumo do seu desempenho (BI pessoal) junto com a programação de estudos do dia seguinte.

## Alterações

### 1. Nova coluna `whatsapp_daily_bi` no `profiles`
Coluna boolean (default `false`) para o usuário optar por receber o BI diário via WhatsApp.

### 2. Toggle no Perfil do usuário (`src/pages/Profile.tsx`)
Adicionar um switch "Receber resumo diário via WhatsApp" na página de perfil, que ativa/desativa a coluna `whatsapp_daily_bi`.

### 3. Nova Edge Function `daily-bi-whatsapp`
Função agendada via cron (executa às 20h) que:
1. Busca usuários com `whatsapp_daily_bi = true`, `whatsapp_opt_out = false`, telefone preenchido
2. Para cada aluno, coleta:
   - **BI do dia**: questões respondidas, acurácia, streak, XP ganho, temas estudados
   - **Programação de amanhã**: revisões pendentes (da tabela `revisoes`), temas críticos
3. Gera mensagem personalizada via IA (Gemini Flash Lite) com formato:
   ```
   📊 Seu resumo de hoje:
   - X questões | Y% acurácia | 🔥 streak Z
   
   📋 Amanhã:
   - Revisão: [temas]
   - Foco: [áreas fracas]
   
   Responda SAIR para não receber mais.
   ```
4. Insere na `whatsapp_message_log` como `pending` para o agente desktop enviar

### 4. Cron Job — Executar às 20h (horário de Brasília)
Agendar `daily-bi-whatsapp` diariamente às 23:00 UTC (20h BRT).

## Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Adicionar coluna `whatsapp_daily_bi` em `profiles` |
| `src/pages/Profile.tsx` | Toggle para ativar/desativar BI diário |
| `supabase/functions/daily-bi-whatsapp/index.ts` | Nova função que gera e enfileira mensagens |
| Cron Job (SQL) | Agendar execução às 20h BRT |

