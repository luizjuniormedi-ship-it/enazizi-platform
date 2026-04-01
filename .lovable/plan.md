
# Nível de Dificuldade no Gerador de Simulados do Professor

## Problema

O painel do professor não permite escolher o nível de dificuldade das questões ao criar um simulado. O professor precisa controlar a proporção de questões fáceis, intermediárias e difíceis.

## Mudanças

### 1. `src/pages/ProfessorDashboard.tsx` — UI de dificuldade

Adicionar na seção "Questões" (entre quantidade e botão gerar):

- **Modo simples**: Select com opções "Fácil", "Intermediário", "Difícil", "Misto"
- **Modo misto (personalizado)**: 3 sliders com percentuais (Fácil / Intermediário / Difícil) que somam 100%
- Preview automático: "10 questões → 2 fáceis, 5 intermediárias, 3 difíceis"
- Os percentuais se ajustam automaticamente (ao mudar um, os outros rebalanceiam)

**Estado novo**:
```typescript
const [difficulty, setDifficulty] = useState("intermediario");
const [difficultyMix, setDifficultyMix] = useState({ facil: 20, intermediario: 50, dificil: 30 });
```

**Preview da distribuição**: Baseado na quantidade selecionada, mostrar quantas questões de cada nível serão geradas. Ex: "20 questões → 4 fáceis (20%), 10 intermediárias (50%), 6 difíceis (30%)".

### 2. `src/pages/ProfessorDashboard.tsx` — Enviar ao `generateQuestionsAI`

Passar `difficulty` e `difficultyMix` no payload da API:
```typescript
const res = await callAPI({
  action: "generate_questions",
  topics: topicsWithSubs,
  count: parseInt(questionCount),
  difficulty,
  difficultyMix: difficulty === "misto" ? difficultyMix : undefined,
});
```

### 3. `supabase/functions/professor-simulado/index.ts` — Usar dificuldade no prompt

No action `generate_questions`, injetar a dificuldade no prompt de geração:
- Se "misto", calcular quantas de cada nível e instruir a IA: "Gere X fáceis, Y intermediárias, Z difíceis"
- Se nível fixo, instruir: "Todas as questões devem ser de nível [X]"

### 4. Preview de questões geradas — badge de dificuldade

Na lista de questões geradas (linha ~685), mostrar badge colorido com o nível de dificuldade de cada questão (verde=fácil, amarelo=intermediário, vermelho=difícil).

## Resultado

Professor controla exatamente a composição de dificuldade do simulado, com preview visual da distribuição antes de gerar.
