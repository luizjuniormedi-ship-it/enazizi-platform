

# Plano: Melhorar o Modulo de Anamnese

## Problemas Identificados

1. **Interface basica** — nao usa o visual premium do TutorZizi (avatar, glass-cards, gradientes)
2. **Chat sem identidade visual** — bolhas simples sem avatar do paciente ou medico
3. **Sidebar checklist ocupa espaco no mobile** — empurra o chat para baixo
4. **Sem sugestoes de perguntas** — aluno iniciante nao sabe por onde comecar
5. **Sem feedback em tempo real** — qualidade da pergunta (question_quality) retorna da IA mas nao e mostrada
6. **Sem historico de casos anteriores** — nao ha como revisar desempenho passado
7. **Lobby sem visual atrativo** — card simples sem ilustracao

## Mudancas Planejadas

### 1. Visual Premium (estilo TutorZizi)
- Header com gradiente e avatar do paciente (icone animado de pessoa)
- Bolhas de chat com avatar: icone de estetoscopio para o aluno, icone de pessoa para paciente
- Glass-cards com bordas brilhantes, mesmas classes do ChatGPT.tsx
- Animacoes de typing (bouncing dots) no lugar do spinner

### 2. Checklist Compacto no Mobile
- No mobile, transformar a sidebar em uma **barra horizontal colapsavel** no topo
- Mostrar icones pequenos com cores (verde=coberto, cinza=pendente) em uma unica linha
- Expandir ao tocar para ver detalhes

### 3. Sugestoes de Perguntas Rapidas
- Adicionar chips clicaveis abaixo do input com sugestoes contextuais:
  - No inicio: "Qual seu nome?", "O que o trouxe aqui?", "Ha quanto tempo sente isso?"
  - Apos cobrir QP: "Tem alguma doenca?", "Toma algum remedio?", "Tem alergia?"
- Os chips mudam conforme categorias ja cobertas

### 4. Indicador de Qualidade da Pergunta
- Mostrar um mini-badge na bolha do paciente indicando a qualidade da pergunta anterior (0-3 estrelas)
- Tooltip com explicacao ("Pergunta excelente — tecnica semiologica adequada")

### 5. Timer Visual Melhorado
- Barra de tempo com cores: verde (< 15min), amarelo (15-25min), vermelho (> 25min)
- Integrar na barra compacta do header

### 6. Historico de Casos (mini-lista no lobby)
- Consultar tabela `anamnesis_results` para mostrar ultimos 5 casos no lobby
- Mostrar: especialidade, nota, data — clicavel para ver detalhes

### 7. Tela de Resultado Aprimorada
- Radar chart com scores por categoria (usando Recharts)
- Comparacao visual "Sua anamnese vs Ideal" lado a lado
- Botao de compartilhar resultado / exportar PDF

## Arquivos Modificados

- **`src/pages/AnamnesisTrainer.tsx`** — refatoracao completa do layout (lobby, active, diagnosis, result) com visual premium, sugestoes de perguntas, checklist compacto mobile, indicadores de qualidade, historico no lobby, e radar chart no resultado

## Impacto

Apenas frontend/visual. A edge function `anamnesis-trainer` e a logica de negocio permanecem inalteradas. Nenhuma migracao de banco necessaria (tabela `anamnesis_results` ja existe).

