

# Banco de Erros de Proficiência — Aba dedicada

## Problema

O banco de erros atual só aparece dentro da view de resultado de um simulado específico. Não existe uma aba consolidada na Proficiência que mostre todos os erros acumulados das atividades do professor (simulados, casos clínicos, temas de estudo), com gabarito comentado e link direto ao Tutor IA.

## Mudança

### `src/pages/StudentSimulados.tsx`

1. **Nova aba "🎯 Banco de Erros"** no TabsList (5ª aba)
   - Query ao `error_bank` filtrando `tipo_questao IN ('simulado', 'diagnostico')` do usuário
   - Também buscar `teacher_simulado_results` com `answers_json` + `teacher_simulados.questions_json` para reconstruir gabarito completo de cada erro
   - Agrupar por `tema`, ordenar por `vezes_errado DESC`

2. **Conteúdo de cada card de tema**:
   - Nome do tema, subtema, badge de gravidade (vermelho ≥3, âmbar ≥2)
   - Expandir para ver cada questão errada com: enunciado, resposta do aluno, resposta correta, explicação comentada
   - Botão "Revisar com Tutor IA" — navega para `/dashboard/chatgpt` com contexto automático
   - Botão "Marcar como Dominado" — atualiza `dominado = true` no `error_bank`

3. **Dados de gabarito**: Para exibir o gabarito comentado, cruzar os registros do `error_bank` (que têm `conteudo` com enunciado resumido) com os `answers_json`/`questions_json` dos simulados concluídos, permitindo mostrar explicação e alternativas

4. **Empty state**: Mensagem motivacional "Nenhum erro registrado — continue praticando!"

## Detalhes técnicos

- `error_bank` já tem RLS para CRUD do próprio usuário e campos `tema`, `subtema`, `conteudo`, `vezes_errado`, `dominado`, `motivo_erro`
- O `logErrorToBank` já é chamado no submit do simulado com `tipo_questao: 'simulado'`
- Nenhuma migração necessária
- O botão "Marcar como Dominado" faz `supabase.from('error_bank').update({ dominado: true, dominado_em: new Date().toISOString() }).eq('id', errorId)`

