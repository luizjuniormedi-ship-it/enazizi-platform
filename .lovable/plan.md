

# Plano: Simplificar a Jornada do Usuário

## Problema
O aluno tem 3 portas de entrada confusas: Dashboard, Plano do Dia e Menu lateral com 20+ itens. Não sabe por onde começar.

## Solução: Jornada Unificada

### 1. Remover "Plano do Dia" como item separado do menu
- Remover `/dashboard/plano-dia` da navegação lateral e mobile
- Redirecionar a rota para `/dashboard` (manter compatibilidade)
- A informação do plano já aparece dentro do HeroStudyCard no Dashboard

### 2. Fortalecer o Dashboard como hub único
- O HeroStudyCard já mostra as tarefas do dia e o botão "Começar Estudo"
- Adicionar um resumo visual rápido das tarefas pendentes (revisões, questões, conteúdo novo) direto no card
- O clique vai para o Modo Missão, que executa tudo em sequência

### 3. Simplificar o menu lateral
- Reorganizar em 3 grupos claros:
  - **Estudar**: Dashboard, Tutor IA, Simulados, Flashcards
  - **Progresso**: Analytics, Banco de Erros, Rankings, Conquistas
  - **Ferramentas**: Resumos, Apostilas, Discursivas, Coach, etc.
- Remover itens redundantes (Plano do Dia, Plano Geral fica apenas dentro de settings/perfil ou como sub-tela)

### 4. Manter acesso direto aos módulos
- Alunos que querem ir direto em Simulados ou Flashcards continuam podendo pelo menu
- Mas o caminho recomendado é sempre Dashboard → Missão

## Arquivos a alterar
1. **`DashboardSidebar.tsx`** — reorganizar grupos, remover Plano do Dia
2. **`DashboardLayout.tsx`** — atualizar mobileNavGroups
3. **`App.tsx`** — redirect `/dashboard/plano-dia` → `/dashboard`
4. **`HeroStudyCard.tsx`** — incluir mini-resumo do plano inline

## Resultado
- Aluno abre o app → vê o Dashboard → clica "Começar Estudo" → Missão guia tudo
- Sem confusão entre 3 telas diferentes
- Módulos avulsos continuam acessíveis para quem quiser

