

# Adicionar Desempenho de Proficiência ao BI Diário WhatsApp

## Problema
O BI diário enviado às 18h não menciona atividades de proficiência (simulados, casos clínicos e temas de estudo atribuídos pelo professor). O aluno não sabe como foi seu desempenho nessas atividades.

## Solução
Consultar as 3 tabelas de resultados do professor (`teacher_simulado_results`, `teacher_clinical_case_results`, `teacher_study_assignment_results`) e incluir no prompt da IA uma seção "ATIVIDADES DO PROFESSOR" quando houver dados.

## Dados a coletar por aluno

- **Simulados do professor**: total feitos, nota média, status pendentes
- **Casos clínicos**: total feitos, nota média, se acertou diagnóstico
- **Temas de estudo**: total concluídos vs pendentes

## Mudança

### `supabase/functions/daily-bi-whatsapp/index.ts`

Após a coleta de `temasFracos` (linha ~126), adicionar 3 queries:

1. `teacher_simulado_results` — filtrar por `student_id = user.user_id`, buscar `status`, `score`, `total_questions`
2. `teacher_clinical_case_results` — filtrar por `student_id`, buscar `status`, `final_score`, `grade`, `student_got_diagnosis`
3. `teacher_study_assignment_results` — filtrar por `student_id`, buscar `status`

Montar string `proficienciaInfo` com resumo. Se não houver atividades, string vazia (não polui a mensagem).

No prompt (linha ~131), adicionar bloco condicional:
```
ATIVIDADES DO PROFESSOR:
- Simulados: 2 feitos (média 75%), 1 pendente
- Casos clínicos: 1 feito (nota 8, diagnóstico correto), 0 pendentes
- Temas de estudo: 3 concluídos, 2 pendentes
```

No `buildFallbackMessage`, adicionar parâmetro `proficienciaText` e incluir se não vazio.

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/daily-bi-whatsapp/index.ts` | Consultar 3 tabelas de proficiência; incluir seção no prompt e fallback |

