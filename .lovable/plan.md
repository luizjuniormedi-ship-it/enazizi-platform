

# Documento de Funcionalidades Detalhadas — ENAZIZI

## Objetivo
Gerar um documento PDF profissional e completo descrevendo todos os módulos da plataforma ENAZIZI, detalhando a experiência do usuário em cada um.

## Conteúdo do Documento

O PDF será organizado nas seguintes seções:

### Capa
- Logo/nome ENAZIZI
- Título: "Guia Completo de Funcionalidades"
- Subtítulo: "Experiência do Usuário — Módulo a Módulo"

### 1. Visão Geral da Plataforma
- Arquitetura de camadas: Dashboard → Study Engine → Missão → Módulos
- Fluxo principal do aluno (onboarding → plano → estudo → avaliação)
- Adaptação por banca (ENARE, Revalida, USP, etc.)

### 2. Módulos Detalhados (cada um com: descrição, fluxo do usuário passo a passo, integração com o sistema)

| # | Módulo | Descrição resumida |
|---|--------|--------------------|
| 1 | **Dashboard** | Tela operacional com HeroStudyCard, alertas inteligentes, progresso semanal |
| 2 | **Onboarding** | 4 etapas: prova alvo, data, horas/dia → plano automático |
| 3 | **Tutor IA** | 5 estilos de aprendizado, streaming, PubMed, adaptação por banca |
| 4 | **Modo Missão** | Sequência guiada: Revisão → Conteúdo → Questões → Reforço |
| 5 | **Plano do Dia** | Visualização operacional das tarefas geradas pelo Study Engine |
| 6 | **Plano Geral (Planner)** | Estratégia macro com mentoria do professor integrada |
| 7 | **Simulados** | Modo prova (cronômetro, flags, navegação) + modo estudo |
| 8 | **Flashcards** | Geração automática por tema, revisão FSRS, interface estilo simulado |
| 9 | **Banco de Erros** | Coleta automática de erros, revisão contextual com Tutor |
| 10 | **Mapa de Evolução** | Visualização por especialidade com níveis de domínio |
| 11 | **Anamnese** | Treino semiológico com feedback em tempo real e Quality Stars |
| 12 | **Plantão (Simulação Clínica)** | Casos clínicos interativos com decisões cronometradas |
| 13 | **Prova Prática (OSCE)** | Simulação estilo residência com avaliação estruturada em 4 critérios |
| 14 | **Crônicas Médicas** | Narrativas clínicas imersivas → conversão automática em OSCE |
| 15 | **Nivelamento (Diagnóstico)** | Avaliação inicial para calibrar o Study Engine |
| 16 | **Resumos** | Geração de resumos via IA |
| 17 | **Apostilas (Study Guides)** | Material estruturado por tema |
| 18 | **Discursivas** | Treino de questões dissertativas |
| 19 | **Coach Motivacional** | Apoio emocional e estratégico via IA |
| 20 | **Previsão de Desempenho** | Predição de aprovação baseada em dados |
| 21 | **Proficiência** | Simulados do professor + Sala de Aula virtual |
| 22 | **Rankings** | Competição entre alunos |
| 23 | **Conquistas** | Gamificação com XP e badges |
| 24 | **Analytics** | Gráficos detalhados de desempenho |

### 3. Painel do Professor
- Criação de simulados e temas
- Mentoria com boost no Study Engine
- Relatório de acompanhamento (4 grupos de alunos)
- BI avançado com heatmaps e correlações

### 4. Painel Administrativo
- Gestão de usuários, mensagens, QA automatizado

### 5. Integrações Inteligentes
- Study Engine (motor central de decisão)
- Adaptação por banca
- Repetição espaçada (FSRS)
- Cache e otimização de IA

## Implementação Técnica

1. **Script Python** gerando PDF com `reportlab` ou `fpdf2`
2. Layout profissional com cores da marca (primary indigo/cyan)
3. Ícones e emojis para cada módulo
4. Seções com headers claros e texto descritivo
5. Output em `/mnt/documents/ENAZIZI_Funcionalidades_Detalhadas.pdf`

## Escopo
- Apenas geração do documento (sem alteração de código)
- Documento em português (pt-BR)
- Aproximadamente 15-20 páginas

