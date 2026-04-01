
# Sincronizar as mudanças já feitas em web, PWA e mobile

## Diagnóstico confirmado no código
Eu revisei os arquivos e as mudanças principais já estão no source:
- `src/pages/NotFound.tsx` já tem o botão para `https://enazizi.com`
- `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/components/auth/ProtectedRoute.tsx` e `src/components/FaculdadeCombobox.tsx` já têm os ajustes mobile
- `src/lib/profileValidation.ts` já invalida faculdade fora da lista oficial
- `src/pages/Dashboard.tsx` já não renderiza `DashboardWarnings` nem `AdminSystemAlerts`

Ou seja: o problema não parece ser “faltou editar”. O problema parece ser que parte dos acessos ainda está carregando uma versão antiga.

## Causa raiz mais provável
Hoje o app usa PWA/service worker em produção (`src/main.tsx`) e o app mobile abre a URL web (`capacitor.config.ts` aponta para `https://enazizi.com`). Isso faz um cache antigo afetar tudo ao mesmo tempo:

```text
preview -> código novo
produção / PWA / app mobile -> service worker/cache antigo -> interface antiga
```

Além disso, o link antigo `study-buddy-ai-560.lovable.app` não deve ser usado como referência de validação desse projeto.

## Plano de implementação
1. Corrigir a camada de atualização em `src/main.tsx`
   - adicionar um identificador de release (`APP_RELEASE`)
   - quando a release mudar, desregistrar service workers antigos
   - limpar `CacheStorage`
   - gravar a release nova no `localStorage`
   - forçar um único reload para baixar os assets novos

2. Endurecer a estratégia de atualização PWA
   - manter preview sem service worker
   - em produção, registrar novamente o PWA só depois da limpeza
   - se necessário, desativar o service worker por 1 publicação para quebrar de vez o ciclo de cache velho

3. Limpar código morto dos alertas antigos
   - remover de vez `src/components/dashboard/DashboardWarnings.tsx`
   - remover de vez `src/components/admin/AdminSystemAlerts.tsx`
   - assim evitamos confusão futura entre “arquivo existente” e “arquivo realmente em uso”

4. Adicionar rastreabilidade de versão
   - expor a release atual em log/console no boot
   - opcionalmente mostrar essa versão no admin
   - isso permite confirmar rapidamente se cada dispositivo está na versão certa

5. Publicar novamente a versão limpa e validar no acesso oficial
   - validar usando `enazizi.com`
   - não usar o link antigo para testar
   - conferir especificamente: dashboard, 404, login, cadastro e tela de completar cadastro

## Resultado esperado
Depois dessa correção:
- o popup antigo de “Saúde do Sistema” para de reaparecer
- o alerta antigo “Você ainda não estudou hoje” não volta
- a 404 mostra o link novo
- login/cadastro/mobile passam a refletir o que já está no código
- web, PWA e app mobile passam a carregar a mesma versão real

## Detalhe técnico
O ponto decisivo é este: como `Dashboard.tsx` já não importa os componentes removidos, se eles ainda aparecem para o usuário então ele não está vendo o bundle atual. Por isso a correção precisa ser feita na inicialização/cache/publicação, e não reeditando pela terceira vez as mesmas telas.
