

# Revisão de Questões Geradas no Painel do Professor

## Resumo
Transformar a pré-visualização de questões geradas por IA em uma interface interativa com: (1) clique para expandir e avaliar cada questão, (2) botão de excluir questões indesejadas, (3) regeneração automática para repor as excluídas, e (4) controle de quantidade de questões por especialidade.

## Alterações

### `src/pages/ProfessorDashboard.tsx`

#### 1. Estado expandido para avaliação de questões
- Adicionar estado `expandedQuestion: number | null` para controlar qual questão está expandida
- Ao clicar na questão, expandir mostrando: enunciado completo, todas as alternativas (com gabarito destacado), explicação e tópico
- Permitir colapsar clicando novamente

#### 2. Botão excluir em questões geradas por IA
- Atualmente o botão de excluir só aparece no modo manual (`questionMode === "manual"`)
- Remover essa restrição — exibir o botão de excluir (Trash2) em **todas** as questões (IA e manual)
- Ao excluir uma questão IA: remover do array `generatedQuestions`

#### 3. Botão "Completar excluídas" — regenerar questões faltantes
- Após exclusões, mostrar um aviso: "X questões excluídas. Total atual: Y"
- Adicionar botão "Regenerar X questões faltantes" que chama `generateQuestionsAI` novamente pedindo apenas a diferença
- Passar `previousStatements` das questões restantes para evitar duplicação

#### 4. Distribuição de questões por área
- Adicionar um campo opcional no formulário de criação: "Distribuição por tema"
- Quando múltiplos temas estão selecionados, mostrar inputs numéricos para definir quantas questões de cada tema
- Default: distribuição equilibrada (total / nº de temas)
- Ao gerar, passar para cada lote o tema específico e a quantidade correspondente em vez de misturar tudo

### Detalhes técnicos

**Questão expandida** — o card atual mostra `q.statement?.slice(0, 120)`. Ao expandir:
```
- Enunciado completo
- Alternativas listadas (A-E) com a correta em verde
- Explicação (se houver)
- Badges: tópico, dificuldade, gabarito
```

**Excluir questão IA** — nova função:
```typescript
const removeGeneratedQuestion = (idx: number) => {
  setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx));
};
```

**Regenerar faltantes** — calcular `deficit = parseInt(questionCount) - generatedQuestions.length`, chamar API com `count: deficit` e `previousStatements` das questões restantes, então concatenar.

**Distribuição por área** — novo estado `topicDistribution: Record<string, number>`:
- Quando professor seleciona 3 temas e 30 questões, default: 10 cada
- Professor pode ajustar (ex: Cardiologia 15, Pediatria 10, Cirurgia 5)
- Na geração, faz lotes por tema com a quantidade definida

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ProfessorDashboard.tsx` | Questão expandível ao clicar, excluir questões IA, botão regenerar faltantes, distribuição por tema |

