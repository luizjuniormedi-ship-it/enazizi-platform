

## Plano: Adicionar Semiologia e Anatomia em todos os modulos

Concordo totalmente. Semiologia e base do raciocinio clinico (anamnese, exame fisico, sinais semiologicos) e Anatomia aparece em questoes de cirurgia, ortopedia e provas praticas. Ambas sao cobradas direta ou indiretamente em todas as provas de residencia.

### Arquivos a alterar (adicionar "Semiologia" e "Anatomia" nas listas de topicos)

1. **`src/pages/Simulados.tsx`** - Array `ALL_TOPICS` (linha 12)
2. **`src/pages/DiscursiveQuestions.tsx`** - Array `SPECIALTIES` (linha 17)
3. **`src/pages/ExamSimulator.tsx`** - Array `ALL_AREAS` (linha 233)
4. **`src/pages/ClinicalSimulation.tsx`** - Array `SPECIALTIES` (linha 22)
5. **`src/pages/CronogramaInteligente.tsx`** - Array `SPECIALTIES` (linha 100)
6. **`src/pages/ProfessorDashboard.tsx`** - Array `SPECIALTIES` (linha 18)
7. **`src/components/dashboard/TopicEvolution.tsx`** - Array `SPECIALTIES` (linha 10)
8. **`supabase/functions/bulk-generate-content/index.ts`** - Array `SPECIALTIES` (linha 10) + adicionar `TOPICS_BY_SPECIALTY` para Semiologia e Anatomia

### Mapeamento centralizado

9. **`src/lib/mapTopicToSpecialty.ts`** - Adicionar dois novos mapeamentos:
   - `Semiologia`: keywords como "semiologia", "anamnese", "exame fisico", "ausculta", "palpacao", "percussao", "sinal de", "propedeutica"
   - `Anatomia`: keywords como "anatomia", "anatomic", "muscul", "nervo", "arteria", "veia", "osso", "ligamento", "fascia", "pelve", "mediastino"

### Subtopicos para geracao de conteudo (bulk-generate)

- **Semiologia**: Anamnese, Exame Fisico Geral, Semiologia Cardiovascular, Semiologia Pulmonar, Semiologia Abdominal, Semiologia Neurologica, Sinais Vitais, Propedeutica Armada
- **Anatomia**: Anatomia do Torax, Anatomia Abdominal, Anatomia do Pescoco, Neuroanatomia, Anatomia do Membro Superior, Anatomia do Membro Inferior, Anatomia Pelvica, Anatomia Vascular

### Impacto
- Nenhuma alteracao de banco de dados necessaria (os campos `specialty`/`topic` sao texto livre)
- Flashcards ja usa topicos dinamicos do banco, entao automaticamente aparecera quando houver flashcards com esses temas
- Proficiencia (StudentSimulados) usa questoes atribuidas pelo professor, que agora podera selecionar esses temas

