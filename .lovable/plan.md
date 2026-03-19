

## Plano: Alinhar o Diagnóstico com os demais módulos

O módulo Diagnóstico atualmente opera isolado — não concede XP, não atualiza o Mapa de Domínio, não registra `practice_attempts` e não usa o `mapTopicToSpecialty` para padronizar especialidades. Os outros módulos (Simulados, ExamSimulator, ChatGPT) já fazem tudo isso.

### Lacunas identificadas

| Funcionalidade | Simulados / ChatGPT | Diagnóstico |
|---|---|---|
| Gamificação (XP) | ✅ `addXp` ao finalizar | ❌ Ausente |
| Mapa de Domínio | ✅ Atualiza `medical_domain_map` | ❌ Ausente |
| `practice_attempts` | ✅ Registra tentativas | ❌ Ausente |
| `mapTopicToSpecialty` | ✅ Normaliza tópico → especialidade | ❌ Usa tópicos crus |
| Validação de conteúdo médico | ✅ Regex anti-não-médico | ❌ Ausente |
| Dificuldade configurável | ✅ Fácil/Intermediário/Difícil/Misto | ❌ Apenas adaptativo interno |

### O que será feito

1. **Integrar gamificação (XP)** — Importar `useGamification` e conceder XP ao finalizar (ex: +15 por acerto, +5 por tentativa), igual aos Simulados.

2. **Atualizar Mapa de Domínio** — Após finalização, usar `mapTopicToSpecialty` para normalizar os tópicos e atualizar a tabela `medical_domain_map` (upsert com `questions_answered`, `correct_answers`, `domain_score`).

3. **Registrar `practice_attempts`** — Salvar cada questão respondida na tabela `practice_attempts` para alimentar o histórico unificado.

4. **Normalizar tópicos com `mapTopicToSpecialty`** — Garantir que os tópicos gerados pela IA sejam mapeados para as mesmas especialidades usadas nos outros módulos.

5. **Adicionar validação de conteúdo médico** — Usar o mesmo regex dos Simulados/ExamSimulator para filtrar questões não-médicas geradas pela IA.

### Arquivos afetados

- `src/pages/Diagnostic.tsx` — Adicionar hooks de gamificação, lógica de `medical_domain_map`, `practice_attempts` e `mapTopicToSpecialty` no `handleExamFinish`.
- `src/components/diagnostic/DiagnosticExam.tsx` — Sem mudanças (a interface já está ok).
- `src/components/diagnostic/DiagnosticResult.tsx` — Exibir XP ganho no resultado final.

