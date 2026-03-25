

# Plano: Adicionar Angiologia/Cirurgia Vascular

Referências: Harrison's Principles of Internal Medicine, Tratado de Clínica Médica (USP), Manual de Angiologia e Cirurgia Vascular (SBACV).

## Mudanças

### 1. `src/constants/specialties.ts`
Adicionar `"Angiologia"` no array do Ciclo Clínico (entre as especialidades em ordem alfabética).

### 2. `src/lib/mapTopicToSpecialty.ts`
Nova entrada de keywords:
```
[["angiolog", "vascular", "varizes", "trombose venosa", "insuficiência venosa", "aneurisma de aorta", 
  "doença arterial periférica", "claudicação", "isquemia de membro", "pé diabético", "linfedema", 
  "fístula arteriovenosa", "endarterectomia", "safena", "doppler vascular"], "Angiologia"]
```

### 3. `src/lib/medicalTerms.ts`
Adicionar ~15 termos: trombose venosa profunda (já existe), insuficiência venosa crônica, doença arterial periférica, aneurisma de aorta abdominal, claudicação intermitente, isquemia crítica de membro, úlcera venosa, varizes de membros inferiores, linfedema, fístula arteriovenosa, endarterectomia de carótida, índice tornozelo-braquial, doppler vascular.

### 4. `supabase/functions/daily-question-generator/index.ts`
Adicionar em SPECIALTIES e TOPICS_BY_SPECIALTY:
```
"Angiologia": [
  "Doença Arterial Periférica", "Aneurisma de Aorta", "Trombose Venosa Profunda",
  "Insuficiência Venosa Crônica", "Varizes", "Isquemia Crítica de Membro",
  "Pé Diabético Vascular", "Linfedema", "Claudicação Intermitente",
  "Endarterectomia de Carótida", "Dissecção de Aorta", "Síndrome Compartimental"
]
```

### 5. `supabase/functions/bulk-generate-content/index.ts`
Adicionar `"Angiologia"` no array SPECIALTIES e subtemas equivalentes no objeto TOPICS_BY_SPECIALTY.

### 6. Edge functions de validação
`generate-flashcards/index.ts` já lista "Angiologia" como área válida no prompt — sem mudança necessária.

## Resumo
- **6 arquivos** editados
- **0 migrações** — campos são string livre
- Angiologia aparecerá automaticamente em todos os seletores que usam `SPECIALTY_CYCLES` / `ALL_SPECIALTIES`

