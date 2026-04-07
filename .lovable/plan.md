

# Plano: Adaptar ENAZIZI para Qualquer Concurso / ENEM

## Escopo do Problema

O ENAZIZI está **profundamente acoplado** ao domínio médico. Não se trata de trocar textos — são ~120 arquivos com referências médicas, ~60 edge functions com prompts médicos, tabelas de banco com campos como `especialidade`, e validações que rejeitam conteúdo não-médico. A adaptação é viável, mas equivale a um projeto de **4-6 semanas** de engenharia.

---

## Camadas de Mudança (por ordem de prioridade)

### Camada 1 — Modelo de Dados Genérico
**Problema:** Hoje o banco usa termos como `especialidade`, `tema`, `subtema` hardcoded para medicina.

**Solução:** Criar uma camada de abstração:
- Tabela `domains` (ex: "Medicina", "ENEM", "OAB") com configurações por domínio
- Tabela `domain_areas` (substitui o conceito de "especialidade" — ex: Matemática, Linguagens para ENEM)
- Tabela `domain_topics` (substitui temas médicos)
- Campo `domain_id` em `profiles` para vincular o aluno ao domínio
- Manter as tabelas atuais funcionando (ponte de compatibilidade)

**Arquivos principais:** Migration SQL, `curriculumMatrix.ts`, `curriculumBridge.ts`

### Camada 2 — Configuração de Domínio (Config-Driven)
**Problema:** Listas de especialidades, termos, bibliografias, perfis de bancas estão hardcoded em ~15 arquivos.

**Solução:** Criar um sistema de configuração por domínio:
- `src/lib/domainConfig.ts` — arquivo central com: áreas, termos-chave, bibliografias, bancas, validações
- Perfis de domínio carregados do banco ou de configs estáticas
- Cada domínio define: áreas, exames-alvo, bibliografia, prompt do tutor, regras de validação

**Arquivos impactados:**
- `examProfiles.ts` — hoje tem ENARE/USP/Revalida, precisa suportar ENEM/OAB/concursos
- `mapTopicToSpecialty.ts` — mapeamento de termos para áreas (genérico)
- `medicalTerms.ts` → `domainTerms.ts` (termos por domínio)
- `medicalValidation.ts` → `contentValidation.ts` (validação por domínio)
- `specialtyLevels.ts` — níveis de proficiência por área

### Camada 3 — Prompts e Edge Functions
**Problema:** ~20 edge functions têm prompts com "residência médica", "caso clínico", "paciente", "diagnóstico" hardcoded.

**Solução:**
- `_shared/enazizi-prompt.ts` → `_shared/tutor-prompt.ts` com templates parametrizados por domínio
- `_shared/ai-validation.ts` — remover `NON_MEDICAL_PATTERN`, substituir por validação de domínio
- `_shared/specialty-bibliography.ts` → `_shared/domain-bibliography.ts`
- `_shared/banca-profiles.ts` → parametrizar por domínio
- Cada edge function recebe `domain` no payload e carrega o prompt adequado

**Edge functions principais a adaptar:** `question-generator`, `professor-simulado`, `generate-flashcards`, `study-session`, `mentor-chat`, `generate-daily-plan`, `generate-study-plan`

### Camada 4 — UI e Navegação
**Problema:** Páginas como `MedicalChronicles`, `AnamnesisTrainer`, `ClinicalSimulation`, `PracticalExam` são 100% médicas.

**Solução:**
- Manter essas páginas mas condicioná-las ao domínio "Medicina"
- Para outros domínios, esconder rotas irrelevantes
- Componentes genéricos (Dashboard, Missão, Simulados, Flashcards, Plano de Estudos) funcionam com qualquer domínio
- Telas de onboarding pedem o domínio do aluno
- Menu lateral adapta itens visíveis por domínio

**Páginas exclusivas de medicina (esconder em outros domínios):**
`AnamnesisTrainer`, `ClinicalSimulation`, `MedicalChronicles`, `MedicalDomainMap`, `MedicalImageQuiz`, `MedicalReviewer`, `PracticalExam`, `InterviewSimulator`

### Camada 5 — Study Engine
**Problema:** `studyEngine.ts` tem `CORE_SPECIALTIES` hardcoded e fallbacks para "Clínica Médica".

**Solução:**
- `CORE_SPECIALTIES` carregado do domínio ativo
- Fallbacks genéricos: "Área Principal" em vez de "Clínica Médica"
- Pesos de banca carregados do perfil de exame do domínio
- Lógica de recomendação (FSRS, revisões, error bank) é 100% genérica — não precisa mudar

---

## Estratégia de Execução (faseada)

### Fase 1 — Fundação (1 semana)
1. Criar tabelas `domains`, `domain_areas`, `domain_topics`
2. Criar `domainConfig.ts` com config do domínio "Medicina" (estado atual)
3. Migrar `medicalValidation.ts` → `contentValidation.ts` (parametrizado)
4. Migrar `medicalTerms.ts` → `domainTerms.ts`
5. Adicionar `domain_id` ao `profiles`

### Fase 2 — Prompts Parametrizados (1 semana)
1. Refatorar `enazizi-prompt.ts` para aceitar domínio
2. Adaptar `ai-validation.ts` para validação por domínio
3. Adaptar edge functions críticas (question-generator, generate-flashcards, study-session)

### Fase 3 — Primeiro Domínio Novo (1 semana)
1. Criar config completa para ENEM ou concurso público
2. Adaptar UI de onboarding para seleção de domínio
3. Condicionar rotas e menu por domínio
4. Adaptar `examProfiles.ts` para o novo domínio

### Fase 4 — Polimento (1 semana)
1. Adaptar Dashboard, Rankings, Analytics por domínio
2. Adaptar Study Engine fallbacks
3. Testes end-to-end com ambos os domínios
4. Limpeza de referências médicas em textos genéricos

---

## Riscos

- **Escopo imenso**: 120+ arquivos, 60+ edge functions — risco de regressão
- **Banco de dados**: Migração do schema sem perder dados médicos existentes
- **Prompts**: Cada domínio precisa de prompts bem calibrados para a IA gerar conteúdo de qualidade
- **Tempo**: Mesmo com a estratégia faseada, são ~4 semanas de trabalho intenso

---

## Recomendação

A forma mais segura e rápida é **fazer o Remix do projeto** e depois executar as 4 fases acima no projeto novo. Assim o ENAZIZI médico continua funcionando enquanto a versão genérica é construída em paralelo. Quer que eu comece pela Fase 1?

