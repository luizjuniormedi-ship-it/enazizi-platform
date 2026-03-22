

# Plano: Adicionar Persistência nos 3 Módulos Restantes

## Módulos Faltantes
1. **DiscursiveQuestions** — questões discursivas
2. **MedicalChronicles** — crônicas médicas
3. **MedicalImageQuiz** — quiz de imagens

## Mudanças

### 1. `src/pages/DiscursiveQuestions.tsx`
- `useSessionPersistence({ moduleKey: "discursive" })`
- Salvar: fase atual, especialidade, questão gerada, resposta do aluno
- Banner visível na fase inicial (setup)
- `completeSession()` ao finalizar correção

### 2. `src/pages/MedicalChronicles.tsx`
- `useSessionPersistence({ moduleKey: "chronicles" })`
- Salvar: mensagens do chat, especialidade, dificuldade selecionadas
- Banner visível quando chat está vazio
- `completeSession()` ao limpar conversa

### 3. `src/pages/MedicalImageQuiz.tsx`
- `useSessionPersistence({ moduleKey: "image-quiz" })`
- Salvar: score, filtros (categoria/dificuldade), índice atual, modo (browse/quiz)
- Banner visível no modo browse
- `completeSession()` ao finalizar quiz

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DiscursiveQuestions.tsx` | +persistência |
| `src/pages/MedicalChronicles.tsx` | +persistência |
| `src/pages/MedicalImageQuiz.tsx` | +persistência |

Resultado: **todos os 16 módulos** terão "Continuar de onde parou".

