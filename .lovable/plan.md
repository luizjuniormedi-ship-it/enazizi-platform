

# Plano: Renomear "MedStudy AI" → "ENAZIZI"

Trocar todas as referências visíveis de "MedStudy AI" para "ENAZIZI" em toda a aplicação. Chaves internas de localStorage e nomes de arquivo técnicos permanecem inalterados para não quebrar sessões existentes.

## Arquivos a alterar

| Arquivo | Mudança |
|---------|---------|
| `index.html` | Title, meta description, og:tags, apple-mobile-web-app-title |
| `public/manifest.json` | `name` e `short_name` |
| `capacitor.config.ts` | `appName` e `scheme` |
| `vite.config.ts` | PWA manifest `name` e `short_name` |
| `src/components/landing/Navbar.tsx` | Texto "MedStudy AI" → "ENAZIZI" |
| `src/components/landing/Footer.tsx` | Nome e copyright |
| `src/components/layout/DashboardSidebar.tsx` | Logo alt e texto |
| `src/components/layout/DashboardLayout.tsx` | Logo alt, texto e SheetDescription |
| `src/pages/Login.tsx` | Nome no header |
| `src/pages/Register.tsx` | Nome no header |
| `src/pages/Install.tsx` | Todos os textos "MedStudy AI" |
| `src/components/dashboard/OnboardingTour.tsx` | Mensagem de boas-vindas |
| `src/components/dashboard/SystemGuidePopup.tsx` | Título do mascot |
| `src/lib/exportPdf.ts` | Rodapé do PDF |
| `src/pages/Flashcards.tsx` | Nome no export PDF e mensagens |
| `src/pages/QuestionsBank.tsx` | Nome no export PDF e mensagens |
| `src/pages/ExamSimulator.tsx` | Texto "protocolo MedStudy" |
| `src/pages/MedicalReviewer.tsx` | Welcome message |
| `supabase/functions/_shared/enazizi-prompt.ts` | Identidade do tutor |
| `supabase/functions/medical-reviewer/index.ts` | System prompt |
| `supabase/functions/anamnesis-trainer/index.ts` | System prompt |
| + demais edge functions com referência "MedStudy AI" |

## Regra

- "MedStudy AI" → "ENAZIZI" em todo texto visível ao usuário
- "protocolo MedStudy" → "protocolo ENAZIZI"
- Alt texts das imagens → "ENAZIZI"
- Manter chaves de localStorage e nomes de arquivo internos inalterados

Total: ~48 arquivos, substituição direta de strings.

