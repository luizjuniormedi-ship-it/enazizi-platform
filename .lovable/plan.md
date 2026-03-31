

# Adicionar Campo de Tema Específico no Gerador de Questões e Simulados

## O Que Existe Hoje

Ambos os módulos permitem selecionar **especialidade** (ex: Cardiologia, Pediatria), mas não permitem especificar um **tema/subtema** dentro da especialidade (ex: "Insuficiência Cardíaca Descompensada", "Cetoacidose Diabética").

## Mudanças

### 1. `src/pages/QuestionGenerator.tsx` — Campo de tema específico

- Adicionar um `Input` de texto livre abaixo do seletor de especialidade, com placeholder "Ex: IAM com supra de ST, Cetoacidose diabética..."
- Quando preenchido, o prompt enviado à IA incluirá o tema: `"Gere X questões de {especialidade} focadas em {tema}..."`
- O campo é opcional — se vazio, funciona como hoje (temas variados)
- Atualizar `buildPrompt()` para incorporar o tema
- Atualizar subtitle e welcomeMessage para mostrar o tema quando definido

### 2. `src/components/simulados/SimuladoSetup.tsx` — Campo de tema específico

- Adicionar um `Input` de texto livre abaixo da seleção de especialidades: "Tema específico (opcional)"
- Placeholder: "Ex: Doença de Chagas, Pré-eclâmpsia..."
- Passar o `specificTopic` na config do `onStart`
- Atualizar a interface `onStart` para incluir `specificTopic?: string`

### 3. `src/pages/Simulados.tsx` — Propagar tema ao prompt

- Receber `specificTopic` da config e incluir no prompt de geração de questões do simulado

### Arquivos Impactados

| Arquivo | Mudança |
|---|---|
| `src/pages/QuestionGenerator.tsx` | Novo state `specificTopic`, input de texto, atualizar `buildPrompt()` |
| `src/components/simulados/SimuladoSetup.tsx` | Novo state `specificTopic`, input de texto, incluir no `onStart` |
| `src/pages/Simulados.tsx` | Receber e usar `specificTopic` no prompt de geração |

