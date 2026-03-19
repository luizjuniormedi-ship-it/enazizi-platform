

## Avaliação Completa da Plataforma MedStudy AI

### Visão Geral

A plataforma é um sistema SaaS robusto para preparação de residência médica com **97 usuários ativos**, **5.648 questões** (5.307 globais), **4.887 flashcards**, **277 casos clínicos** e **143 uploads**. A arquitetura é bem estruturada com ~25 módulos integrados via React + Supabase.

---

### PONTOS FORTES

**1. Ecossistema integrado**
- Gamificação (XP/streaks/achievements) presente em Simulados, Diagnóstico, Plantão, Anamnese
- `errorBankLogger` centralizado captura erros de múltiplos módulos
- `mapTopicToSpecialty` normaliza tópicos em 22 especialidades
- Protocolo ENAZIZI padroniza a didática do Tutor IA

**2. Base de conteúdo sólida**
- 5.307 questões globais de fontes reais (USP, UNICAMP, AMRIGS, IDOMED, Revalida, Estratégia MED)
- Cobertura ampla: Cardiologia (520), Ginecologia (553), Clínica Médica (264), Pediatria (204)
- Banco de provas anteriores com processamento automático de PDFs

**3. Módulos diferenciados**
- Modo Plantão (1.398 linhas) — simulação clínica completa com vitais, exames, prescrição
- Anamnese Trainer — treinamento estruturado por categorias com faixas pediátricas
- Tutor IA (ChatGPT, 1.167 linhas) — protocolo didático em 14 passos com RAG

**4. Infraestrutura técnica**
- AI fallback (Lovable → OpenAI) com retry/backoff em `ai-fetch.ts`
- RLS bem implementado em todas as tabelas
- PWA com Service Worker e cache management
- Sistema de roles (admin/professor/user) com security definer functions

---

### PROBLEMAS IDENTIFICADOS

**🔴 Críticos**

| # | Problema | Impacto |
|---|---------|---------|
| 1 | **`medical_domain_map` praticamente vazio** (apenas 3 registros para 97 usuários) | O Mapa de Evolução, Radar Chart e Previsão de Desempenho estão vazios para quase todos |
| 2 | **Tópicos não normalizados no `questions_bank`** — "Ginecologia" (469) vs "Ginecologia e Obstetrícia" (84) vs "ginecologia" (37) são contados separadamente | Analytics, radar e domínio fragmentados |
| 3 | **`practice_attempts` com apenas 25 registros** para 97 usuários — módulos não estão registrando tentativas consistentemente | Métricas do Dashboard são irreais |

**🟡 Importantes**

| # | Problema | Impacto |
|---|---------|---------|
| 4 | Simulados e QuestionsBank não atualizam `medical_domain_map` após conclusão (só Diagnóstico e Tutor fazem isso) | Dados de maestria incompletos |
| 5 | Flashcards (4.887) não integram com gamificação — sem XP por revisão de flashcard | Desengajamento no módulo |
| 6 | Validação de conteúdo médico (`NON_MEDICAL_CONTENT_REGEX`) existe só em ExamSimulator, não nos demais geradores | Questões não-médicas podem vazar |
| 7 | Não há tabela `flashcards` visível no schema fornecido, mas é referenciada em código — possível inconsistência | — |

**🟢 Melhorias Recomendadas**

| # | Melhoria | Benefício |
|---|---------|-----------|
| 8 | Normalizar todos os tópicos existentes no `questions_bank` usando `mapTopicToSpecialty` (migration SQL) | Dados limpos para analytics |
| 9 | Backfill do `medical_domain_map` a partir dos `practice_attempts` e `exam_sessions` existentes | Dashboard preenchido |
| 10 | Adicionar `practice_attempts` insert no Simulados, QuestionsBank e Flashcards | Métricas unificadas |
| 11 | Integrar `medical_domain_map` upsert em Simulados, Plantão e Anamnese | Mapa de evolução completo |
| 12 | Adicionar XP em Flashcards (revisão) e QuestionsBank (resolver questão) | Engajamento |

---

### MATRIZ DE INTEGRAÇÃO (Estado Atual)

```text
Módulo               │ XP │ DomainMap │ Attempts │ ErrorBank │ Validação
──────────────────────┼────┼──────────┼──────────┼───────────┼──────────
Tutor IA (ChatGPT)   │ ✅ │ ✅        │ ❌       │ ❌        │ ✅
Diagnóstico          │ ✅ │ ✅        │ ✅       │ ✅        │ ❌
Simulados            │ ✅ │ ❌        │ ❌       │ ✅        │ ❌
ExamSimulator        │ ✅ │ ❌        │ ❌       │ ✅        │ ✅
Plantão              │ ✅ │ ❌        │ ❌       │ ✅        │ ❌
Anamnese             │ ✅ │ ❌        │ ❌       │ ❌        │ ❌
QuestionsBank        │ ✅ │ ❌        │ ✅       │ ✅        │ ❌
Flashcards           │ ❌ │ ❌        │ ❌       │ ✅        │ ❌
Discursivas          │ ❌ │ ❌        │ ❌       │ ❌        │ ❌
```

---

### PLANO DE AÇÃO RECOMENDADO

**Fase 1 — Dados limpos (prioritária)**
1. Migration SQL para normalizar tópicos no `questions_bank` (unificar "Ginecologia" → "Ginecologia e Obstetrícia", etc.)
2. Script de backfill do `medical_domain_map` a partir de dados existentes

**Fase 2 — Integração cruzada**
3. Adicionar `medical_domain_map` upsert em Simulados, Plantão, Anamnese, ExamSimulator
4. Adicionar `practice_attempts` insert em Simulados e Flashcards
5. Adicionar XP em Flashcards e Discursivas

**Fase 3 — Qualidade**
6. Aplicar validação médica (`NON_MEDICAL_CONTENT_REGEX`) em todos os geradores
7. Adicionar ErrorBank logging nos módulos que não possuem (Anamnese, Discursivas)

Quer que eu implemente alguma dessas fases?

