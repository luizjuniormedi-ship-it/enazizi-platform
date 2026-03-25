

# Plano: Adicionar Fisiologia e Bioquímica como Especialidades

## Escopo

Adicionar "Fisiologia" e "Bioquímica" em todos os arrays de especialidades do sistema, com subtemas baseados nas literaturas de referência indicadas.

**Referências:**
- Fisiologia: Guyton e Hall, Ganong, Costanzo
- Bioquímica: Lehninger, Marks, Lippincott

## Mudanças

### 1. Listas de SPECIALTIES (10 arquivos)

Adicionar `"Fisiologia", "Bioquímica"` em:

| Arquivo | Linha aprox |
|---|---|
| `src/pages/QuestionGenerator.tsx` | 12-19 |
| `src/pages/ExamSimulator.tsx` | 264-267 |
| `src/pages/CronogramaInteligente.tsx` | 104-108 |
| `src/pages/ProfessorDashboard.tsx` | 21-27 |
| `src/pages/DiscursiveQuestions.tsx` | 24-27 |
| `src/pages/ClinicalSimulation.tsx` | 42-45 |
| `src/components/simulados/SimuladoSetup.tsx` | 14-17 |
| `src/components/professor/TeacherStudyAssignments.tsx` | 21-24 |
| `src/components/dashboard/TopicEvolution.tsx` | 14-17 |
| `supabase/functions/daily-question-generator/index.ts` | SPECIALTIES + TOPICS_BY_SPECIALTY |
| `supabase/functions/bulk-generate-content/index.ts` | 16-20 |

### 2. Subtemas (daily-question-generator)

Adicionar em `TOPICS_BY_SPECIALTY`:

```
"Fisiologia": [
  "Fisiologia Cardiovascular", "Fisiologia Respiratória", "Fisiologia Renal",
  "Fisiologia do Sistema Nervoso", "Fisiologia Endócrina", "Fisiologia Gastrointestinal",
  "Fisiologia Muscular", "Neurofisiologia", "Potencial de Ação e Transmissão Sináptica",
  "Equilíbrio Ácido-Base", "Regulação da Pressão Arterial", "Hemodinâmica",
  "Termorregulação", "Fisiologia do Exercício"
],
"Bioquímica": [
  "Metabolismo de Carboidratos", "Metabolismo de Lipídios", "Metabolismo de Aminoácidos",
  "Ciclo de Krebs", "Cadeia Transportadora de Elétrons", "Glicólise e Gliconeogênese",
  "Beta-Oxidação", "Síntese de Ácidos Graxos", "Biologia Molecular do DNA e RNA",
  "Enzimologia Clínica", "Vitaminas e Coenzimas", "Bioenergética",
  "Erros Inatos do Metabolismo", "Integração Metabólica"
]
```

### 3. Mapeamento de termos (mapTopicToSpecialty.ts)

Adicionar duas novas entradas de keywords:

```
["fisiologi", "guyton", "potencial de ação", "hemodinâmica", "termorregulação", ...], "Fisiologia"
["bioquímic", "lehninger", "metabolismo", "glicólise", "krebs", "enzima", ...], "Bioquímica"
```

### 4. Termos médicos (medicalTerms.ts)

Adicionar termos de Fisiologia e Bioquímica ao array para highlighting:
- Fisiologia: potencial de ação, débito cardíaco, volume sistólico, pressão oncótica, filtração glomerular, etc.
- Bioquímica: glicólise, ciclo de Krebs, fosforilação oxidativa, beta-oxidação, gliconeogênese, etc.

### 5. Edge Functions (prompts de validação)

Já listam Fisiologia e Bioquímica como áreas válidas nos prompts — nenhuma mudança necessária.

## Resumo

- **13 arquivos** editados
- **0 migrações** necessárias (os dados já aceitam qualquer string como topic/specialty)
- Questões geradas automaticamente pelo cron passarão a cobrir Fisiologia e Bioquímica

