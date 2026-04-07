

# Revisão: Dificuldade dos Simulados

## Diagnóstico

Não há bug de código que force "intermediário". O que acontece:

1. **Default em ambos os fluxos é `"intermediario"`** — se o usuário não alterar, todas as questões saem intermediárias
2. **No modo "misto" do Professor**, a distribuição padrão é 20% fácil / 50% intermediário / 30% difícil — ainda pendendo para intermediário
3. O prompt da IA respeita corretamente o nível escolhido; não há sobrescrita

## Proposta

### 1. Alterar default para "misto" em ambos os fluxos
- `src/components/simulados/SimuladoSetup.tsx` — mudar default de `"intermediario"` para `"misto"`
- `src/pages/ProfessorDashboard.tsx` — mudar default de `"intermediario"` para `"misto"`

### 2. Rebalancear distribuição "misto"
- Professor: de `{facil: 20, intermediario: 50, dificil: 30}` para `{facil: 20, intermediario: 40, dificil: 40}`
- Aluno (Simulados.tsx buildPrompt): a instrução "misto" já pede 30% intermediário / 70% difícil — manter

### 3. Feedback visual claro
- No setup do aluno, ao selecionar "misto", mostrar a distribuição esperada: "30% intermediárias, 70% difíceis"
- No Professor, já existe o preview de distribuição — apenas ajustar os valores padrão

## Arquivos alterados
1. `src/components/simulados/SimuladoSetup.tsx` — default → "misto", adicionar label de distribuição
2. `src/pages/ProfessorDashboard.tsx` — default → "misto", rebalancear mix

## O que NÃO muda
- Edge functions, prompts da IA, Study Engine, banco de dados

