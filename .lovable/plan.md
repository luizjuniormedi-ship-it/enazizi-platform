

# Corrigir Auto-Save nos Simulados (Regular + Proficiência)

## Problemas Encontrados

### 1. Simulados Regular (`Simulados.tsx`) — Salva mas SEM respostas
- Linha 593: `onAutoSaveState={() => ({ current: 0, selectedAnswers: {}, timeLeft: 0 })}` retorna dados VAZIOS
- O `examStateRef` nunca é atualizado pelo `SimuladoExam` — as questões são salvas mas as **respostas do aluno ficam perdidas**
- O `SimuladoExam` não reporta mudanças de estado ao pai

### 2. Simulados Professor (`StudentSimulados.tsx`) — Zero registros no banco
- O código de auto-save está correto na teoria, mas o `beforeunload` handler usa `saveSession` async que é cancelado quando a página fecha
- Sem `navigator.sendBeacon`, fechar/atualizar a página perde tudo
- O intervalo de 30s significa que os primeiros 30 segundos de quiz não são protegidos

### 3. `useSessionPersistence.ts` — `beforeunload` não funciona
- Usa `saveSession()` (fetch async) que é **cancelado pelo browser** ao fechar a página
- O `sendBeacon` está comentado como "TODO" mas nunca implementado

## Solução

### 1. `SimuladoExam.tsx` — Reportar estado real ao pai
- Adicionar prop `onStateChange?: (state) => void`
- Usar `useEffect` para chamar `onStateChange` quando `selectedAnswers`, `current`, `timeLeft`, `flaggedQuestions` mudam
- Aceitar `flaggedQuestions` e `revealedQuestions` no `initialState`

### 2. `Simulados.tsx` — Capturar estado real do exam
- Substituir o callback dummy `onAutoSaveState` por `onStateChange` que atualiza `examStateRef.current` com dados reais
- No `handleResumeSession`, restaurar `flaggedQuestions` e `revealedQuestions`

### 3. `useSessionPersistence.ts` — Salvar imediatamente + sendBeacon
- No `beforeunload`, usar `navigator.sendBeacon` com a Supabase REST API diretamente (funciona mesmo com página fechando)
- Adicionar método `saveNow()` que salva imediatamente (não espera 30s)
- Adicionar `console.warn` no catch para debug (em vez de silêncio total)

### 4. `StudentSimulados.tsx` — Salvar ao mudar resposta
- Chamar `saveSession()` diretamente quando o aluno seleciona uma resposta (além do intervalo de 30s)
- Garantir que a primeira resposta já gera um registro no banco

## Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/simulados/SimuladoExam.tsx` | Adicionar `onStateChange` + aceitar flags no initialState |
| `src/pages/Simulados.tsx` | Capturar estado real via `onStateChange`; restaurar flags |
| `src/pages/StudentSimulados.tsx` | Salvar ao selecionar resposta (além do intervalo) |
| `src/hooks/useSessionPersistence.ts` | Implementar `sendBeacon` no beforeunload; expor `saveNow`; log de erros |

