

# Tutor Fullscreen — Ocupar Tela Inteira

## Problema

O botão de expandir do Tutor já usa `fixed inset-0 z-[100]` com `createPortal`, mas o conteúdo ainda tem padding e não esconde completamente a sidebar/header. O resultado é que não parece "tela cheia" de verdade.

## Mudanças

### 1. `src/pages/ChatGPT.tsx`

- Quando `isFullscreen`, remover padding (`p-0` em vez de `p-2 sm:p-4`)
- Adicionar `overflow-hidden` para evitar scroll do body
- Manter `z-[100]` e `createPortal` (já funciona)

### 2. `src/components/tutor/TutorHeader.tsx`

- Em fullscreen, adicionar padding interno no header para compensar a remoção do padding externo
- Garantir que o botão de minimizar fique visível e acessível

### 3. `src/pages/ChatGPT.tsx` — Layout interno

- Em fullscreen, o `TutorMessageList` deve usar `flex-1 min-h-0` para ocupar todo o espaço restante
- O `TutorInputBar` deve ficar fixo no fundo
- Esconder elementos desnecessários em fullscreen (StudyContextBanner, ResumeSessionBanner) para maximizar área útil

### Resultado

Ao clicar em expandir, o Tutor ocupa 100% da viewport (sem sidebar, sem header, sem padding), como um app de chat em tela cheia. Botão de minimizar restaura o layout normal.

