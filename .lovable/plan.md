

# Fix: Banco de Questões — Contagem Total Não Bate

## Problema

A página mostra "Mostrando X de Y questões" onde:
- **Y** (`totalCount`) = contagem exata do banco (query com `count: "exact"`) — inclui TODAS as questões aprovadas
- **X** (`questions.length`) = questões após filtro client-side (`isMedicalQuestion` + `options.length >= 4`)

Questões que falham no filtro de validação médica ou têm menos de 4 alternativas são removidas silenciosamente, causando divergência entre o número mostrado e o real.

## Solução

1. **Corrigir a contagem exibida**: Mostrar apenas o total de questões que passam no filtro, não o total bruto do banco.
2. **Mover a contagem "real" para o subtítulo**: Exibir `"{filtered.length} questões disponíveis"` como contagem principal, e o total do banco apenas como referência secundária.
3. **Limpar questões ruins do banco**: Executar DELETE no banco para remover permanentemente questões com menos de 4 alternativas ou que não passam no filtro médico, eliminando a divergência na raiz.

## Mudanças

### 1. Limpeza no banco de dados (via psql)

- Deletar questões onde `jsonb_array_length(options) < 4`
- Deletar questões que não contenham termos médicos no statement+topic (non-medical content)
- Registrar quantas foram removidas

### 2. `src/pages/QuestionsBank.tsx`

- Linha 367: Trocar `{totalCount}` por contagem real filtrada
- Usar `filtered.length` como número principal exibido
- Exibir total do banco como referência secundária: `"({totalCount} no banco total)"`

### Arquivos Impactados

| Arquivo | Mudança |
|---|---|
| `src/pages/QuestionsBank.tsx` | Ajustar texto de contagem para refletir questões efetivamente disponíveis |
| Banco de dados | Limpeza de questões com < 4 alternativas e conteúdo não-médico |

