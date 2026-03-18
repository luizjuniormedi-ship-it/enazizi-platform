

# Plano: Bloquear acesso sem cadastro completo

## Problema Identificado

O `ProtectedRoute` ja verifica perfil incompleto e exibe o formulario de onboarding. Porem, as rotas `/admin` e `/professor` usam `AdminRoute` e `ProfessorRoute` que **nao verificam** se o perfil esta completo -- permitindo acesso sem cadastro finalizado.

## Solucao

1. **AdminRoute e ProfessorRoute**: Envolver o conteudo com `ProtectedRoute` para herdar a verificacao de perfil incompleto, em vez de renderizar `children` diretamente.

2. **App.tsx**: Ajustar as rotas admin/professor para usar `ProtectedRoute` internamente (wrapping), garantindo que a trava de onboarding se aplique a **todas** as rotas autenticadas.

Mudancas em 2 arquivos:
- `src/components/auth/AdminRoute.tsx` -- adicionar verificacao de perfil ou wrapping com ProtectedRoute
- `src/components/auth/ProfessorRoute.tsx` -- idem

