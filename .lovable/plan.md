

# Completar Cobertura do Cronograma — Temas Faltantes

## Problema
O cronograma de 50 semanas cobre 19 especialidades (~307 temas), mas áreas relevantes cobradas nas provas estão ausentes:

```text
Área ausente              | Questões no banco | Impacto
--------------------------|-------------------|--------
Clínica Médica (geral)    | ~793              | Alto — temas transversais
Oncologia                 | ~245              | Alto — cobrada em todas as bancas
Urologia                  | ~206              | Médio — cobrada em Cirurgia
Terapia Intensiva (UTI)   | ~200+             | Alto — emergência e internato
Angiologia                | ~200+             | Médio
Farmacologia (básico)     | ~300+             | Alto para ENAMED/Revalida
Patologia (básico)        | ~200+             | Alto para ENAMED/Revalida
Anatomia (básico)         | ~200+             | Médio para ENAMED/Revalida
```

## Solução
Adicionar ~40 temas faltantes distribuídos nas semanas 14-50 (que têm espaço), sem alterar temas existentes.

### Temas a adicionar por área

**Oncologia** (6 temas — semanas 24-38):
- Princípios de Oncologia e Estadiamento TNM
- Câncer de Próstata
- Câncer Gástrico (além do já existente em Gastro)
- Câncer de Pulmão (complemento ao já existente)
- Rastreamento Oncológico
- Neutropenia Febril em Oncologia

**Urologia** (4 temas — semanas 25-40):
- Hiperplasia Prostática Benigna
- Litíase Urinária
- Câncer de Bexiga e Rim
- Infecções Urológicas

**Terapia Intensiva** (5 temas — semanas 29-45):
- Ventilação Mecânica
- Sedação e Analgesia em UTI
- Sepse e Choque Séptico
- Monitorização Hemodinâmica
- Nutrição em Terapia Intensiva

**Angiologia** (3 temas — semanas 28-40):
- Doença Arterial Periférica
- Trombose Venosa Profunda e TEP
- Insuficiência Venosa Crônica

**Clínica Médica — temas transversais** (5 temas — semanas 24-40):
- Dor Crônica e Cuidados Paliativos
- Avaliação Pré-Operatória Clínica
- Emergências Metabólicas
- Síndromes Paraneoplásicas
- Polifarmácia e Interações Medicamentosas

**Ciclo Básico (ENAMED/Revalida)** (8 temas — semanas 25-49):
- Farmacologia — Antimicrobianos
- Farmacologia — Anti-Hipertensivos
- Farmacologia — Analgésicos e Anti-inflamatórios
- Patologia Geral — Inflamação e Reparo
- Patologia — Neoplasias (Biologia Tumoral)
- Anatomia Cirúrgica do Abdome
- Anatomia — Cabeça e Pescoço
- Fisiologia Renal e Ácido-Básica

## Arquivo editado
- `src/constants/baseCurriculum.ts` — adicionar ~31 novos itens ao array `BASE_CURRICULUM`, distribuídos em semanas com menor carga (14, 24-29, 38-50)

## Impacto
- `CURRICULUM_TOTAL_TOPICS` sobe de ~307 para ~338
- Study Engine passa a sugerir esses temas via "curriculum gap filler"
- CurriculumCoverageCard reflete a cobertura real
- ExamReadiness melhora o `coverage_score`
- Zero alteração em lógica existente — apenas dados adicionados ao array

