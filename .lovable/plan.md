

# Validação End-to-End do ENAZIZI

## Objetivo
Executar uma jornada completa simulando um usuário real, desde o primeiro acesso até uso contínuo, e gerar um relatório de prontidão.

## Metodologia

Usar as ferramentas de browser para navegar pela aplicação em viewport mobile (430x661) e desktop, testando cada fluxo. Complementar com leitura de código, console logs e network requests para identificar falhas silenciosas.

## Etapas de Validação

### Fase 1 — Primeiro Acesso e Registro
- Navegar para `/` (landing page)
- Verificar CTA principal, layout mobile, textos em pt-BR
- Navegar para `/register` e `/login`
- Verificar formulários, validações e fluxo

### Fase 2 — Onboarding
- Verificar se o fluxo OnboardingV2 aparece para novo usuário
- Testar as 3-4 etapas (prova alvo, data, horas)
- Verificar tela "Analisando seu perfil" e "Seu plano está pronto"

### Fase 3 — Dashboard
- Verificar HeroStudyCard com CTA "COMEÇAR ESTUDO"
- Validar layout mobile (thumb-friendly)
- Checar cards de mentoria, progresso semanal, alertas
- Verificar ausência de excesso de informação

### Fase 4 — Modo Missão e Tutor IA
- Inspecionar código do fluxo de missão (MissionMode)
- Verificar sequência pedagógica (Revisão → Conteúdo → Questões → Reforço)
- Inspecionar StudySession e estilos de aprendizado do Tutor
- Verificar prompts e adaptação por banca via código

### Fase 5 — Continuidade e Persistência
- Verificar ResumeSessionBanner no código
- Inspecionar lógica de `module_sessions` e `sendBeacon`

### Fase 6 — Mentoria do Professor
- Navegar para `/professor` (se autenticado)
- Verificar MentorThemePlans com inputs livres
- Verificar MentorshipReport e filtros

### Fase 7 — Módulos Específicos
- Verificar rotas de Simulados, Flashcards, OSCE, Crônicas
- Inspecionar integração com Study Engine via código
- Verificar fallbacks e error boundaries

### Fase 8 — Performance e Erros
- Coletar console logs e network requests
- Verificar chamadas duplicadas
- Inspecionar error boundaries (SafeCard, ErrorBoundary)
- Verificar fallbacks de IA (safeQuery, aiFetch retry)

### Fase 9 — Mobile e UX
- Testar em viewport 430x661
- Verificar BottomTabBar, scroll, touch targets
- Validar que CTA principal é visível sem scroll

## Entregável

Relatório completo em PDF (`/mnt/documents/ENAZIZI_Validacao_E2E.pdf`) contendo:
- Checklist de funcionalidades (OK / Problema / Não testável)
- Screenshots de telas principais
- Problemas encontrados com severidade
- Melhorias sugeridas
- Nível de prontidão geral

## Limitação
Fluxos que requerem autenticação real (cadastro, Tutor IA com chamada de edge function, mentoria ativa) serão validados por inspeção de código + logs quando não for possível simular no browser sem conta logada.

