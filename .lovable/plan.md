

# Plano: Mover Notificações/Busca/Tema para fora do conteúdo + Dropdown em todas as telas restantes

## Problemas
1. **Botão de notificações (desktop)**: O bloco `GlobalSearch + NotificationBell + Tema` está fixado em `fixed top-4 right-4 z-50` dentro do `<main>`, sobrepondo os headers dos módulos. Precisa ser movido para não conflitar.
2. **Headers com botões sobrepostos**: Módulos que ainda não foram corrigidos têm múltiplos botões visíveis que se empilham: Crônicas Médicas, Discursivas, Banco de Erros, Analytics, Uploads.

## Mudanças

### 1. `src/components/layout/DashboardLayout.tsx` — Reposicionar barra superior desktop
- Mover o bloco `GlobalSearch + NotificationBell + Tema` de `fixed top-4 right-4` para uma barra fixa dentro do header (acima do conteúdo, não sobrepondo)
- Usar `sticky top-0` em vez de `fixed` para não flutuar sobre os módulos
- Adicionar padding-top no conteúdo se necessário

### 2. `src/pages/MedicalChronicles.tsx` — Dropdown para botões
- Mover Favorito, Nova, Histórico e ModuleHelp para um `DropdownMenu` (⋮)
- Manter apenas Fullscreen visível

### 3. `src/pages/DiscursiveQuestions.tsx` — Dropdown para botões
- Mover Nova Questão, Histórico para dropdown
- Manter apenas Fullscreen visível

### 4. `src/pages/ErrorBank.tsx` — Dropdown para botões
- Mover ModuleHelp, Gerar Flashcards, Atualizar para dropdown
- Manter título limpo

### 5. `src/pages/Analytics.tsx` — Dropdown para botões
- Mover ModuleHelp e PerformanceReport para dropdown

### 6. `src/pages/Uploads.tsx` — Sem mudança necessária (só 1 botão)

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/layout/DashboardLayout.tsx` | Reposicionar barra de notificações/busca/tema para não sobrepor conteúdo |
| `src/pages/MedicalChronicles.tsx` | Dropdown (⋮) com ações secundárias |
| `src/pages/DiscursiveQuestions.tsx` | Dropdown (⋮) com ações secundárias |
| `src/pages/ErrorBank.tsx` | Dropdown (⋮) com ações secundárias |
| `src/pages/Analytics.tsx` | Dropdown (⋮) com ações secundárias |

