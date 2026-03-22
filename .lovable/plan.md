

# Plano: Melhorar Interacao Paciente-Medico no Plantao

## Problema Atual
A interacao e basicamente um chat de texto simples. O aluno digita texto livre ou clica em botoes genericos (Anamnese, Exame Fisico, etc.) que enviam prompts fixos. Falta imersao, estrutura e guia clinico.

## Melhorias

### 1. Quick Actions Expandidos e Contextuais
Substituir os 6 botoes genericos por acoes mais especificas e organizadas em categorias:

**Anamnese**: HDA, Antecedentes Pessoais, Antecedentes Familiares, Habitos de Vida, Medicamentos em Uso, Alergias, Revisao de Sistemas
**Exame Fisico**: Sistemas especificos (Cardiovascular, Respiratorio, Abdome, Neurologico, Musculoesqueletico, Cabeca/Pescoco, Pele/Mucosas)
**Exames**: Hemograma, Bioquimica, Gasometria, ECG, Rx Torax, TC, USG, RM
**Conduta**: Acesso Venoso, Monitorizacao, Oxigenoterapia, Sonda, IOT

Implementar como dropdown/popover por categoria em vez de botoes inline.

### 2. Painel de Evolucao do Paciente
Adicionar uma area visivel mostrando:
- Timeline visual das acoes realizadas (icones + hora)
- Status do paciente com animacao de transicao (estavel -> instavel -> grave)
- Alerta visual pulsante quando paciente piora (borda vermelha, shake)

### 3. Chat Imersivo
- Avatar do paciente nos baloes de mensagem (icone de pessoa)
- Avatar do medico nos baloes enviados (icone de estetoscopio)
- Indicador de "paciente digitando..." com dots animados
- Formatacao markdown basica (negrito, italico) no texto das respostas
- Destaque visual para sinais vitais mencionados no texto (badge inline)

### 4. Painel de Sinais Vitais Mobile
- Substituir `hidden lg:block` por um botao flutuante que abre Sheet/Drawer no mobile
- Mostrar mini-resumo de vitais sempre visivel (PA e FC no status bar)

### 5. Feedback Sonoro e Visual por Acao
- Som sutil diferente para: resposta do paciente, piora do paciente, score positivo, score negativo
- Animacao de flash verde/vermelho no score quando muda
- Toast automatico quando paciente muda de status

### 6. Edge Function: Vitais Dinamicos Obrigatorios
Atualizar o prompt para que TODA resposta de interacao inclua `vitals` atualizados e campo `critical_action_needed` para alertas de emergencia.

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/ClinicalSimulation.tsx` | Quick actions expandidos com popovers por categoria, avatares no chat, typing indicator, feedback sonoro/visual, Sheet mobile para vitais, timeline de acoes, alerta de piora |
| `supabase/functions/clinical-simulation/index.ts` | Prompt atualizado: vitals obrigatorios em toda resposta, campo critical_action_needed, scoring refinado |

## Detalhes Tecnicos
- Popover do shadcn para categorias de acoes rapidas
- Sheet do shadcn para painel de vitais no mobile
- CSS keyframes para animacoes de alerta (pulse, shake)
- AudioContext para sons sutis diferenciados
- Nenhuma mudanca no banco de dados

