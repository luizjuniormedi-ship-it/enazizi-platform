

## Rebranding: ENAZIZI → MedStudy AI

Renomear todas as referências do projeto de "ENAZIZI" para "MedStudy AI" em 55 arquivos.

### Escopo das mudanças

**Frontend (UI visível ao usuário):**
- Landing page: Navbar, HeroSection, FeaturesSection, Footer
- Dashboard: Sidebar, Layout mobile, BottomTabBar
- Onboarding, SystemGuide, WhatsNew popups
- Install page (PWA)
- Páginas de agentes (AgentsHub, AIMentor, MedicalReviewer, etc.)
- Saudações motivacionais, TopicEvolution, DiagnosticResult

**Backend (Edge Functions):**
- `enazizi-prompt.ts` → renomear referências internas para "MedStudy AI"
- Todas as edge functions que mencionam "ENAZIZI" nos system prompts (mentor-chat, clinical-simulation, content-summarizer, motivational-coach, medical-reviewer, etc.)

**Configuração:**
- `index.html` — title e meta tags
- `public/manifest.json` — name e short_name
- `capacitor.config.ts` — appName

**Assets:**
- Manter o arquivo `enazizi-mascot.png` (é o mascote, só mudar o alt text)
- Renomear imports de variável `enazizi` → `mascot` para clareza

**Testes:**
- Atualizar strings nos testes (Landing.test, DashboardSidebar.test)

**localStorage keys:**
- Manter as keys existentes (`enazizi_onboarding_completed`, etc.) para não quebrar estado dos usuários atuais

### Regra de substituição

| De | Para |
|---|---|
| `ENAZIZI` (display) | `MedStudy AI` |
| `Protocolo ENAZIZI` | `Protocolo MedStudy` |
| `sistema ENAZIZI` | `sistema MedStudy AI` |
| `tutor ENAZIZI` | `tutor MedStudy AI` |
| Alt text `ENAZIZI` | `MedStudy AI` |

### Arquivos principais (~30 edições)

1. `index.html`, `public/manifest.json`, `capacitor.config.ts`
2. `src/components/landing/*` (Navbar, Footer, FeaturesSection)
3. `src/components/layout/DashboardSidebar.tsx`, `DashboardLayout.tsx`, `BottomTabBar.tsx`
4. `src/components/dashboard/*` (OnboardingTour, SystemGuidePopup, WhatsNewPopup, MotivationalGreeting)
5. `src/pages/Install.tsx`, `AgentsHub.tsx`, `AIMentor.tsx`
6. `src/components/diagnostic/DiagnosticResult.tsx`, `TopicEvolution.tsx`, `InteractiveQuestionCard.tsx`
7. `src/components/professor/ClassAnalytics.tsx`
8. `supabase/functions/_shared/enazizi-prompt.ts` + todas as edge functions
9. Testes: `Landing.test.tsx`, `DashboardSidebar.test.tsx`

