

# Plano: Renomear Tutor IA para "TutorZizi"

Trocar todas as ocorrências do nome "Tutor IA" / "Tutor IA Médico" para **TutorZizi** nos seguintes locais:

| Arquivo | Mudança |
|---|---|
| `src/pages/ChatGPT.tsx` | Substituir títulos e referências "Tutor IA Médico" / "Tutor IA" por "TutorZizi" |
| `src/components/layout/DashboardSidebar.tsx` | Label do menu: "🤖 Tutor IA" → "🤖 TutorZizi" |
| `src/components/layout/BottomTabBar.tsx` | Se houver referência ao Tutor IA, renomear |
| `src/test/DashboardSidebar.test.tsx` | Atualizar assertion "🤖 Tutor IA" → "🤖 TutorZizi" |

