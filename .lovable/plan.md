

# Refinamento UX do ENAZIZI

## Problema
O sistema tem funcionalidades robustas mas a experiência apresenta inconsistências que prejudicam a fluidez:
1. **Menu mobile desatualizado** — contém itens removidos (Gerador Flashcards, Gerador Questões, Banco de Questões) e falta "Prova Prática"
2. **FreeStudyCard aponta para rotas obsoletas** — "Questões" aponta para banco-questoes que foi removido da navegação
3. **Dashboard acima da dobra tem elementos demais** — greeting + badges + XP + achievement + video room + exam setup antes do HeroStudyCard
4. **Sidebar e mobile nav dessincronizados** — estrutura de grupos e itens diferente entre os dois

## Alterações

### 1. Sincronizar menu mobile com sidebar (`DashboardLayout.tsx`)
- Remover itens obsoletos: `gerar-flashcards`, `questoes`, `banco-questoes`
- Adicionar `prova-pratica` no grupo "Avaliação" (renomear para "Prática")
- Alinhar grupos mobile com a mesma estrutura da sidebar

### 2. Atualizar FreeStudyCard (`FreeStudyCard.tsx`)
- Trocar "Questões" (banco-questoes) por "Prova Prática" (prova-pratica)
- Manter 6 módulos de acesso rápido, todos apontando para rotas ativas

### 3. Compactar zona acima do HeroStudyCard (`Dashboard.tsx`)
- Mover badges de provas alvo para dentro do greeting (inline, sem card extra)
- Remover `ExamSetupReminder` e `ActiveVideoRoomBanner` do topo — já existem como popups/banners independentes
- Garantir que o HeroStudyCard esteja visível sem scroll em viewport 430x661

### 4. Simplificar greeting
- Condensar greeting + streak + provas alvo em uma única linha compacta
- XpWidget permanece no canto direito

### 5. Reordenar cards pós-hero para fluxo lógico
Ordem final no Dashboard (abaixo do hero):
1. SmartAlertCard (máx 1 alerta)
2. MentorshipBanner (condicional)
3. ExamReadinessCard (chance por prova)
4. WeeklyEvolutionBar (progresso semanal)
5. Grid 2x2 de métricas drill-down
6. FreeStudyCard (acesso livre)
7. AdminMessages + InstallApp (secundários)

### 6. Otimização de performance
- Mover `OnboardingChecklist` para dentro de `Suspense` (já é condicional, lazy load não prejudica)
- Certificar que nenhum componente do Dashboard importa módulos pesados de forma síncrona

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/components/layout/DashboardLayout.tsx` | Sincronizar mobileNavGroups com sidebar |
| `src/components/dashboard/FreeStudyCard.tsx` | Trocar rota obsoleta por Prova Prática |
| `src/pages/Dashboard.tsx` | Reordenar e compactar zona acima da dobra |

## Resultado
- Menu mobile e desktop 100% sincronizados
- Nenhuma rota quebrada nos atalhos
- HeroStudyCard visível sem scroll no mobile
- Fluxo visual: ação primeiro, informação depois

