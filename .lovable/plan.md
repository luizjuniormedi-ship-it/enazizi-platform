

# Plano: Botoes de Filtro por Ciclo (Basico / Clinico / Internato)

## O que sera feito

Adicionar botoes de filtro "Ciclo Basico", "Ciclo Clinico" e "Internato" como primeiro nivel de filtragem antes da lista de especialidades. Ao clicar num ciclo, apenas as especialidades daquele ciclo aparecem. Botao "Todos" mostra tudo.

## Componente reutilizavel

Criar `src/components/CycleFilter.tsx` — um componente que renderiza os botoes de ciclo e filtra as especialidades exibidas. Sera importado em todos os modulos que precisam.

```text
┌──────────────────────────────────────────────────┐
│  [Todos] [Ciclo Básico] [Ciclo Clínico] [Internato]  │
│                                                        │
│  (especialidades filtradas aparecem abaixo)            │
└──────────────────────────────────────────────────┘
```

## Arquivos a alterar

| Arquivo | Tipo de seletor atual | Mudanca |
|---|---|---|
| **Novo:** `src/components/CycleFilter.tsx` | — | Componente com botoes de ciclo + callback de filtro |
| `src/pages/QuestionGenerator.tsx` | `<Select>` flat | Adicionar CycleFilter acima do Select, filtrar opcoes |
| `src/pages/ExamSimulator.tsx` | Chips toggle (flat) | Adicionar CycleFilter acima dos chips |
| `src/components/simulados/SimuladoSetup.tsx` | Chips agrupados por ciclo (headers) | Adicionar botoes de ciclo para mostrar/esconder grupos |
| `src/pages/DiscursiveQuestions.tsx` | `<Select>` flat | Adicionar CycleFilter acima do Select |
| `src/pages/ClinicalSimulation.tsx` | `<select>` nativo flat | Adicionar CycleFilter acima do select |
| `src/pages/ProfessorDashboard.tsx` | Chips toggle (flat) + Select | Adicionar CycleFilter em ambos os seletores |
| `src/components/professor/TeacherStudyAssignments.tsx` | `<Select>` flat | Adicionar CycleFilter acima do Select |
| `src/components/dashboard/TopicEvolution.tsx` | `<Select>` flat | Adicionar CycleFilter acima do Select |
| `src/pages/CronogramaInteligente.tsx` | Usa ALL_SPECIALTIES internamente | Adicionar CycleFilter onde aplicavel |

## Detalhes tecnicos

**CycleFilter component:**
- Props: `activeCycle: string | null`, `onCycleChange: (cycle: string | null) => void`
- Renderiza 4 botoes: "Todos" (null), e um por cada `SPECIALTY_CYCLES[].label`
- Estilo: botoes compactos pill/chip, destaque no ativo
- Exporta helper `getFilteredSpecialties(cycle: string | null): string[]` para uso nos modulos

**Integracao nos seletores:**
- **Select dropdown** (QuestionGenerator, Discursive, etc.): estado `cycleFilter`, filtra as opcoes do `<SelectContent>`
- **Chips toggle** (ExamSimulator, ProfessorDashboard): filtra os chips visiveis, mantem selecao mesmo quando filtro muda
- **SimuladoSetup**: ja tem agrupamento visual; os botoes de ciclo vao mostrar/esconder os grupos inteiros

