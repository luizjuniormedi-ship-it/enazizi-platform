

## Plano: Adicionar Farmacologia como Especialidade

Adicionar "Farmacologia" em **9 arquivos**, seguindo o mesmo padrão das outras especialidades.

### Arquivos a alterar

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | `src/components/dashboard/TopicEvolution.tsx` | Adicionar "Farmacologia" ao array `SPECIALTIES` |
| 2 | `src/pages/Simulados.tsx` | Adicionar "Farmacologia" ao array `ALL_TOPICS` |
| 3 | `src/pages/ExamSimulator.tsx` | Adicionar "Farmacologia" ao array `ALL_AREAS` |
| 4 | `src/pages/DiscursiveQuestions.tsx` | Adicionar "Farmacologia" ao array `SPECIALTIES` |
| 5 | `src/pages/ClinicalSimulation.tsx` | Adicionar "Farmacologia" ao array `SPECIALTIES` |
| 6 | `src/pages/CronogramaInteligente.tsx` | Adicionar "Farmacologia" ao array `SPECIALTIES` |
| 7 | `src/pages/ProfessorDashboard.tsx` | Adicionar "Farmacologia" ao array `SPECIALTIES` |
| 8 | `src/lib/mapTopicToSpecialty.ts` | Adicionar keywords: `"farmacolog", "farmacocinética", "farmacodinâmica", "posologia", "mecanismo de ação", "receptor", "agonista", "antagonista", "inibidor", "interação medicamentosa", "efeito adverso", "meia-vida"` |
| 9 | `src/pages/MedicalDomainMap.tsx` | Adicionar entrada em `SPECIALTIES_WITH_TOPICS` com subtemas |
| 10 | `supabase/functions/bulk-generate-content/index.ts` | Adicionar ao `SPECIALTIES` e `TOPICS_BY_SPECIALTY` |

### Subtemas de Farmacologia (para MedicalDomainMap e bulk-generate)

- Farmacocinética (Absorção, Distribuição, Metabolismo, Excreção)
- Farmacodinâmica e Receptores
- Antibioticoterapia e Mecanismos de Resistência
- Anti-hipertensivos e Vasodilatadores
- Antiarrítmicos
- Anticoagulantes e Antiplaquetários
- AINEs e Corticoides
- Analgésicos e Opioides
- Psicofarmacologia (Antidepressivos, Antipsicóticos, Ansiolíticos)
- Quimioterápicos e Imunossupressores
- Farmacologia do Sistema Nervoso Autônomo
- Interações Medicamentosas e Reações Adversas
- Anti-diabéticos Orais e Insulinoterapia
- Broncodilatadores e Anti-asmáticos

**Total: 10 arquivos, 0 migrações de banco.**

