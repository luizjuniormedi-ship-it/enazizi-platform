
Objetivo: restaurar a visibilidade da funcionalidade de Professor no layout atual (especialmente em telas ~1020px, onde o sidebar desktop fica oculto e o app usa o menu mobile).

1) Diagnóstico confirmado
- Em `src/components/layout/DashboardLayout.tsx`, o menu mobile (`MobileNav`) não renderiza o link **Painel Professor**.
- O menu mobile também exibe **Admin** sem checagem de papel.
- Como o sidebar desktop usa `lg:flex` e a viewport atual está em ~1020px, o usuário vê apenas o menu mobile; por isso “não aparece”.

2) Implementação (UI/rotas)
- Atualizar `MobileNav` para usar as mesmas permissões do sidebar desktop:
  - importar e usar `useProfessorCheck` e `useAdminCheck`;
  - renderizar link `/professor` somente quando `isProfessor || isAdmin`;
  - renderizar link `/admin` somente quando `isAdmin`.
- Manter comportamento de fechamento do menu ao clicar nos links.
- Adicionar estado de loading das permissões no mobile para evitar flicker de links.

3) Consistência entre navegações
- Alinhar a seção de links “perfil/professor/admin” do mobile com a lógica já existente em `DashboardSidebar.tsx` para evitar divergência futura.
- (Opcional no mesmo ajuste) extrair configuração de links/permite para uma estrutura compartilhada entre desktop e mobile.

4) Correção de acessibilidade já apontada no console (mesmo arquivo)
- No `SheetContent` do menu mobile, incluir `SheetTitle` e `SheetDescription` (podem ser visualmente ocultos) para eliminar warnings de acessibilidade do Dialog/Sheet e reduzir ruído de debug.

5) Validação pós-implementação
- Testar com conta professor/admin em largura ~1020px:
  - abrir menu hamburger e confirmar presença de “Painel Professor”;
  - navegar para `/professor` com sucesso.
- Testar com conta comum:
  - confirmar ausência de “Painel Professor” e “Admin”.
- Testar em desktop (>=1024px) para garantir que sidebar antigo continua correto.

Detalhes técnicos
- Arquivo principal: `src/components/layout/DashboardLayout.tsx`.
- Reuso de padrão já existente em: `src/components/layout/DashboardSidebar.tsx`, `src/hooks/useProfessorCheck.ts`, `src/hooks/useAdminCheck.ts`.
- Sem mudanças de banco/autenticação; é ajuste de renderização condicional no frontend.
