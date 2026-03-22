

# Plano: Persistência de Sessão — "Continuar de Onde Parei"

## Problema
Quando o usuário perde conexão ou fecha o navegador durante um módulo interativo (simulação clínica, anamnese, simulado de prova, etc.), todo o progresso é perdido e ele precisa recomeçar do zero.

## Solução
Criar um sistema de auto-save que persiste o estado dos módulos no banco de dados, com banner de recuperação ao reabrir.

---

## 1. Migração SQL — Tabela `module_sessions`

```text
module_sessions
├── id (uuid, PK)
├── user_id (uuid, NOT NULL)
├── module_key (text, NOT NULL) — ex: "clinical-simulation", "anamnesis", "exam-simulator"
├── session_data (jsonb, NOT NULL, DEFAULT '{}')
├── status (text, DEFAULT 'active') — "active" | "completed" | "abandoned"
├── created_at (timestamptz, DEFAULT now())
├── updated_at (timestamptz, DEFAULT now())
└── UNIQUE(user_id, module_key, status) WHERE status = 'active'
```

RLS: Users can CRUD own sessions (`user_id = auth.uid()`).

## 2. Hook `useSessionPersistence` (novo)

- Recebe `moduleKey` e `getState()` callback
- Auto-save a cada 30s via `setInterval` + `beforeunload`
- `checkForSession()` — retorna sessão ativa se existir
- `saveSession(data)` — upsert na tabela
- `completeSession()` — marca status = 'completed'
- `abandonSession()` — marca status = 'abandoned'

## 3. Componente `ResumeSessionBanner` (novo)

- Banner compacto: "📌 Sessão em andamento (salva há X min) — [Continuar] [Descartar]"
- Exibido no topo do módulo quando há sessão ativa
- "Continuar" chama callback de restore
- "Descartar" marca como abandoned

## 4. Integração nos Módulos

| Módulo | module_key | Estado salvo |
|--------|-----------|-------------|
| Simulação Clínica | `clinical-simulation` | phase, messages, vitals, score, specialty, timeline, realisticMode |
| Treino Anamnese | `anamnesis` | phase, messages, specialty, categories_covered |
| Simulado de Provas | `exam-simulator` | phase, questions, answers, current, timeLeft, examConfig |
| Tutor IA (ChatGPT) | `chatgpt` | messages, currentTopic (já tem parcial) |
| Flashcards | `flashcards` | current index, mode |
| Sessão de Estudo | `study-session` | messages, performance |

Para cada módulo:
- Importar hook + banner
- No `useEffect` inicial, checar sessão existente
- Exibir banner se houver
- Auto-save do estado relevante
- Marcar `completed` ao finalizar normalmente

## Arquivos Criados/Modificados

| Arquivo | Ação |
|---------|------|
| **Migração SQL** | Criar `module_sessions` com RLS |
| `src/hooks/useSessionPersistence.ts` | **NOVO** — hook de auto-save/restore |
| `src/components/layout/ResumeSessionBanner.tsx` | **NOVO** — banner de retomada |
| `src/pages/ClinicalSimulation.tsx` | Integrar persistência |
| `src/pages/AnamnesisTrainer.tsx` | Integrar persistência |
| `src/pages/ExamSimulator.tsx` | Integrar persistência |
| `src/pages/ChatGPT.tsx` | Integrar persistência |
| `src/pages/Flashcards.tsx` | Integrar persistência |
| `src/pages/StudySession.tsx` | Integrar persistência |

## Detalhes Técnicos
- Auto-save via `setInterval(30s)` + `window.addEventListener("beforeunload")`
- Partial unique index: `CREATE UNIQUE INDEX ON module_sessions (user_id, module_key) WHERE status = 'active'` — garante apenas 1 sessão ativa por módulo
- Upsert usa `ON CONFLICT` para atualizar sessão existente
- Dados serializado em JSONB — cada módulo define seu próprio schema

