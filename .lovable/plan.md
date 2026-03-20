

# Atualização do Nome no Ícone PWA

## Diagnóstico

Os arquivos de manifesto (`vite.config.ts` e `public/manifest.json`) **já estão corretos** com o nome "MedStudy AI". Não há nenhuma referência residual a "ENAZIZI" nos manifests.

O nome antigo que alguns usuários veem no ícone da tela inicial é um **cache do sistema operacional** da instalação anterior.

## Comportamento por Plataforma

- **Android**: O Chrome atualiza o nome automaticamente ao detectar mudança no manifest (pode levar até 30 dias). O mecanismo de force-update no login que já existe no app acelera isso.
- **iOS**: O nome do ícone **nunca é atualizado** após instalação. O usuário precisa deletar o app e reinstalar.

## Plano de Ação

Nenhuma alteração de código é necessária — os manifests já estão corretos.

Para garantir que os usuários recebam a atualização mais rápido no Android, o sistema de force-update no login (já implementado em `useAuth.tsx`) já faz `caches.delete()` + `registration.update()`, o que força o navegador a buscar o novo manifest.

Para iOS, a única solução é orientar os usuários a reinstalarem o PWA.

