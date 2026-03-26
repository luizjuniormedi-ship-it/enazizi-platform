

# Plano: Melhorias Globais de UX

## Alterações

### 1. Transições de página — `DashboardLayout.tsx`
- Envolver o `<Outlet>` com wrapper que aplica `animate-fade-in` ao trocar de rota (usando `key={location.pathname}`)
- Sem dependência externa — usa as animações CSS já definidas no Tailwind config

### 2. Loading skeleton — novo `PageSkeleton.tsx`
- Componente com skeleton imitando layout de página (header + 4 cards + area de conteúdo)
- Substituir o `PageLoader` (spinner genérico) no `App.tsx` pelo skeleton

### 3. Bottom Bar auto-hide — `BottomTabBar.tsx`
- Detectar direção de scroll: esconder ao rolar para baixo, mostrar ao rolar para cima
- Transição suave com `translate-y` e `transition-transform`

### 4. Feedback tátil — `DashboardSummaryCard.tsx`
- Já tem `active:scale-[0.98]` — reforçar com `transition-transform duration-150` e hover elevation

### 5. Theme — `useTheme.ts`
- Já persiste em localStorage — OK, sem mudança necessária

## Arquivos
- Criar: `src/components/layout/PageSkeleton.tsx`
- Editar: `src/components/layout/DashboardLayout.tsx`, `src/App.tsx`, `src/components/layout/BottomTabBar.tsx`, `src/components/dashboard/DashboardSummaryCard.tsx`

