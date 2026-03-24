

# Plano: Melhorias no Modo Plantao

## O que ja existe

O modulo e bastante completo: chat imersivo com paciente, quick actions categorizadas (Anamnese, Exame Fisico, Exames, Conduta), sinais vitais com grafico temporal, painel de exames, prescricao estruturada, pedido de parecer especialista, dica do preceptor, modo realista com deterioracao por inatividade, suporte pediatrico, historico de simulacoes, fullscreen, persistencia de sessao.

## Melhorias propostas

### 1. Checklist ABCDE de Atendimento Inicial
Adicionar um checklist visual colapsavel no topo da simulacao com os passos do atendimento sistematizado (A-Vias aereas, B-Respiracao, C-Circulacao, D-Neurologico, E-Exposicao). Cada item marca automaticamente quando o aluno realiza a acao correspondente (detectado pelo tipo de mensagem). Isso ensina o metodo sistematico e mostra visualmente o que falta.

### 2. Mini-Prontuario Lateral
Criar um painel "prontuario" que acumula automaticamente as informacoes coletadas durante o caso: dados do paciente (nome, idade, queixa), achados de anamnese, achados de exame fisico por sistema, resultados de exames. Hoje essas informacoes ficam perdidas no chat. O prontuario funciona como uma "cola organizada" que o aluno consultaria num caso real.

### 3. Score Detalhado em Tempo Real
Ao inves de mostrar apenas "Score: 72/100", exibir um breakdown por categoria (Anamnese, Exame Fisico, Exames, Conduta) em mini barras de progresso na barra de status. O aluno ve em tempo real onde esta indo bem e onde esta falhando, sem esperar o resultado final.

### 4. Modo Tutorial com Dicas Contextuais
Adicionar um toggle "Modo Aprendiz" no lobby. Quando ativo, apos cada resposta do paciente, o sistema mostra um card colapsavel com uma dica didatica contextual (ex: apos exame fisico respiratorio, mostra "Lembre-se: na ausculta pulmonar, compare os campos simetricamente"). Isso transforma o plantao de avaliacao pura em ferramenta de ensino.

### 5. Exportar Caso como PDF de Estudo
Adicionar botao na tela de resultado para gerar um PDF com o caso completo: apresentacao, condutas do aluno, condutas ideais, diagnosticos diferenciais, pontos fortes/fracos. O aluno pode revisar offline.

## Arquivos a alterar

| Arquivo | Mudanca |
|---|---|
| `src/pages/ClinicalSimulation.tsx` | Checklist ABCDE, mini-prontuario, score detalhado, toggle modo aprendiz, botao exportar PDF |
| `supabase/functions/clinical-simulation/index.ts` | Retornar `category_scores` parciais em cada interacao, dicas contextuais no modo aprendiz, dados estruturados para prontuario |

## Detalhes tecnicos

- **Checklist ABCDE**: Estado `abcdeChecklist: Record<string, boolean>`. Deteccao automatica via keywords na mensagem do aluno (ex: "via aerea" marca A, "ausculta" marca B). Exibido como 5 icones coloridos no status bar.
- **Mini-Prontuario**: Estado `medicalRecord: { demographics, anamnesis[], physicalExam[], exams[], prescriptions[] }`. Populado automaticamente parseando `response_type` da API. Renderizado num painel lateral colapsavel (desktop) ou Sheet (mobile).
- **Score por categoria**: A API ja retorna `evaluation` com categorias no `finish`. Adicionar campo `partial_scores` na resposta de `interact` para tracking incremental. Exibir 4 mini barras no status bar.
- **Modo Aprendiz**: Novo campo `learner_mode: true` enviado na API. O prompt da edge function adiciona instrucao para incluir `teaching_tip` na resposta. Exibido como card colapsavel abaixo de cada mensagem da simulacao.
- **Export PDF**: Reutilizar `src/lib/exportPdf.ts` existente, montando HTML com os dados do `finalEval` + mensagens do chat.

