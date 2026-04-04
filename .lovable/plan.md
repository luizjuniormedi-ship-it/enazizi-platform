

# Atualizar Páginas de Entrada (Landing + Login) e Corrigir Botão "Entrar" no Mobile

## Problema
O botão "Entrar" some no mobile na Navbar da Landing page. As páginas de entrada (Landing e Login) precisam de atualização visual e consistência entre desktop, tablet e mobile.

## Análise do Código Atual

A Navbar já tem um bloco `md:hidden` com botão "Entrar" (linha 33-40). O problema pode ser:
1. O botão `variant="ghost"` com `size="sm"` fica invisível sobre o vídeo hero (texto branco/transparente sobre fundo escuro)
2. A Navbar usa `bg-background/80` que pode não ter contraste suficiente sobre o vídeo

## Solução

### 1. Navbar — Corrigir botão "Entrar" no mobile
- Trocar o botão "Entrar" mobile de `variant="ghost" size="sm"` para `variant="outline" size="sm"` com borda visível
- Garantir que a navbar tenha `bg-background/95` no mobile para contraste sobre o vídeo
- Aumentar o touch target do botão para `h-10 min-w-[72px]`

### 2. Landing Page — Atualização visual
- HeroSection: melhorar responsividade dos CTAs no mobile (padding, font-size)
- ConversionBadgesSection: ajustar grid de badges para mobile (2 colunas em vez de wrap)
- CTASection: garantir que botões não fiquem cortados em telas pequenas

### 3. Login Page — Atualização mobile
- No mobile (`< lg`), o left panel (hero) ocupa muito espaço vertical — condensar stats e esconder features
- Garantir que o formulário fique visível sem scroll excessivo no mobile
- Adicionar logo ENAZIZI (mascot) no topo do form mobile em vez do Brain icon genérico

### 4. Consistência cross-platform
- Verificar que todos os breakpoints (320px, 375px, 414px, 768px, 1024px+) renderizam corretamente
- Navbar: mesma aparência em PWA, browser mobile e desktop

## Arquivos a editar
- `src/components/landing/Navbar.tsx` — fix botão "Entrar" mobile + contraste
- `src/components/landing/HeroSection.tsx` — ajustes mobile menores
- `src/components/landing/CTASection.tsx` — responsividade
- `src/components/landing/ConversionBadgesSection.tsx` — grid mobile
- `src/pages/Login.tsx` — condensar hero panel no mobile, melhorar UX do form

## Impacto
- Botão "Entrar" sempre visível no mobile
- Páginas de entrada consistentes em todas as plataformas
- Zero alteração em lógica de autenticação ou backend

