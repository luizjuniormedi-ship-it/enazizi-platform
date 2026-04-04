

# Refinamento Completo do ENAZIZI — UX, Consistência e Integração

## Diagnóstico

Após auditoria do Dashboard, MissionMode, StudyEngine, SmartAlertCard, HeroStudyCard e módulos relacionados, o sistema já está bem estruturado. Os refinamentos identificados são cirúrgicos.

## Inconsistências Encontradas

| # | Problema | Severidade | Arquivo |
|---|----------|-----------|---------|
| 1 | MissionMode exibe `currentTask.reason` bruto do engine (ex: "Acerto de 45% em Cardiologia") em vez de usar `getHumanReadableReason()` | Média | `MissionMode.tsx` |
| 2 | HeroStudyCard não mostra motivo da tarefa principal — só tema e tempo | Média | `HeroStudyCard.tsx` |
| 3 | FreeStudyCard mostra "Acesso livre" sem indicar o que é prioridade — pode distrair | Baixa | `FreeStudyCard.tsx` |
| 4 | SmartAlertCard não mostra o tema específico do erro quando há erros acumulados | Média | `SmartAlertCard.tsx` |
| 5 | RecentProgressCard pode não aparecer (depende de evolutions) sem fallback | Baixa | Dashboard.tsx |
| 6 | DashboardSummaryCard "Streak" repete 🔥 do greeting (informação duplicada) | Baixa | `Dashboard.tsx` |

## Plano de Correções

### 1. MissionMode — Humanizar motivos das tarefas
**Arquivo**: `src/pages/MissionMode.tsx`
- Importar `getHumanReadableReason` de `@/lib/humanizedReasons`
- Substituir `{currentTask.reason}` por `{getHumanReadableReason(currentTask)}` na tela de tarefa ativa (linha ~228)
- Fazer o mesmo no FocusHardMode (linha ~142)

### 2. HeroStudyCard — Adicionar motivo da primeira tarefa
**Arquivo**: `src/components/dashboard/HeroStudyCard.tsx`
- Importar `getHumanReadableReason`
- Abaixo do subtítulo "topTask.topic · ~Xmin", adicionar uma linha com o motivo humanizado em texto menor
- Manter compacto: 1 linha, `text-xs text-muted-foreground`

### 3. SmartAlertCard — Enriquecer alerta de erros com tema
**Arquivo**: `src/components/dashboard/SmartAlertCard.tsx`
- Na Priority 3 (erros), buscar o tema com mais erros do `useDashboardData` (já disponível via `data`)
- Trocar mensagem genérica por: "X erros acumulados em [tema principal] — revise para não repetir"
- Se não houver tema específico, manter fallback genérico

### 4. Dashboard — Remover streak duplicado do grid
**Arquivo**: `src/pages/Dashboard.tsx`
- O greeting já mostra "🔥 X dias seguidos"
- No grid de métricas, trocar o card "Streak" por "Evolução" mostrando a accuracy geral e delta semanal, que é mais útil

### 5. FreeStudyCard — Adicionar label de contexto
**Arquivo**: `src/components/dashboard/FreeStudyCard.tsx`
- Trocar título "Acesso livre" por "Explorar módulos"
- Adicionar subtítulo discreto: "Estude fora da missão"

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/MissionMode.tsx` | Usar `getHumanReadableReason()` nos motivos |
| `src/components/dashboard/HeroStudyCard.tsx` | Adicionar motivo humanizado da tarefa principal |
| `src/components/dashboard/SmartAlertCard.tsx` | Enriquecer alerta de erros com tema específico |
| `src/pages/Dashboard.tsx` | Trocar card Streak duplicado por Evolução |
| `src/components/dashboard/FreeStudyCard.tsx` | Renomear para "Explorar módulos" |

## O que NÃO muda
- Study Engine, FSRS, cronograma, mentoria, OSCE, readiness por banca
- Estrutura do Dashboard (HeroStudyCard, ExamReadinessCard, etc.)
- Lógica de missão, persistência, cache invalidation
- Nenhuma funcionalidade removida

## Resultado
Dashboard e Missão passam a usar linguagem 100% humanizada, sem métricas técnicas expostas. Alertas ficam mais específicos. Informação duplicada eliminada. Experiência mais clara e orientada à ação.

