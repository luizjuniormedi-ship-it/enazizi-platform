

# Correção: Simulados só geram questões intermediárias

## Diagnóstico — 3 causas encontradas

### Causa 1 — Professor: Reset força "intermediário"
**`src/pages/ProfessorDashboard.tsx` linha 430:**
```
setDifficulty("intermediario");
setDifficultyMix({ facil: 20, intermediario: 50, dificil: 30 });
```
Após criar um simulado, o reset força o padrão de volta para "intermediário" em vez de "misto". E o `difficultyMix` padrão pende 70% para fácil+intermediário.

**Mas o bug principal**: a linha 53 inicializa com `"misto"`, então o reset é o problema na segunda geração em diante.

### Causa 2 — Professor backend: sobrescreve difficulty_level individual
**`supabase/functions/professor-simulado/index.ts` linha 253:**
```
difficulty_level: difficulty || "intermediario",
```
Quando busca do cache, **ignora** o `difficulty_level` que a questão já tem e substitui pelo parâmetro global. Então mesmo que a IA tenha gerado questões difíceis, o sistema sobrescreve para "intermediario".

### Causa 3 — Aluno backend: fallback sempre intermediário
**`supabase/functions/question-generator/index.ts` linha 261:**
```
diffMap[difficulty] || diffMap.intermediario
```
Se `difficulty` não bater exatamente com as chaves do mapa (ex: "misto" funciona, mas qualquer typo cai em intermediário). O mapa em si trata "facil" como "INTERMEDIÁRIO BAIXO", não como fácil de verdade.

---

## Correções

### 1. ProfessorDashboard.tsx — Reset com "misto"
- Linha 430: `setDifficulty("misto")` em vez de `"intermediario"`
- Linha 431: `setDifficultyMix({ facil: 20, intermediario: 40, dificil: 40 })` — balanceamento mais desafiador

### 2. professor-simulado/index.ts — Preservar difficulty_level individual
- Linha 253: trocar `difficulty_level: difficulty || "intermediario"` por `difficulty_level: q.difficulty_level || difficulty || "intermediario"` — preserva o nível que a IA atribuiu à questão
- Linha 369: idem, fallback do banco já é "intermediario" — manter
- Linha 409: já usa `q.difficulty_level || difficulty` — correto

### 3. question-generator/index.ts — Tornar "facil" realmente fácil
- Linha 256: trocar descrição de "facil" para algo que realmente peça questões fáceis, não "intermediário baixo"
- Manter o fallback `diffMap.intermediario` como segurança

---

## Arquivos alterados
1. `src/pages/ProfessorDashboard.tsx` — reset para "misto" + mix balanceado
2. `supabase/functions/professor-simulado/index.ts` — preservar difficulty_level da questão
3. `supabase/functions/question-generator/index.ts` — "facil" = fácil de verdade

## O que NÃO muda
- Fluxo do aluno no `SimuladoSetup.tsx` (já inicia com "misto")
- Prompt principal de geração no `Simulados.tsx` (já tem instruções corretas por dificuldade)
- Banco de dados, missão, plano diário

