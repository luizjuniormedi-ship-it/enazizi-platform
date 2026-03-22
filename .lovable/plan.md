

# Plano: Fix Banner de Sessão no Tutor IA + Botões Sobrepostos em Todos os Módulos

## Problemas

1. **Banner "Continuar de onde parei" não aparece no Tutor IA**: O banner está no código (linha 851), mas a condição `pendingSession && !studyStarted` pode não estar funcionando corretamente — o `sessionChecked` pode estar `false` durante o render inicial, ou o banner está sendo renderizado mas fica escondido atrás dos cards de performance.

2. **Botões sobrepostos no header**: No Tutor IA (e possivelmente outros módulos), o header tem 5 botões (Como usar, Tela cheia, Finalizar, Nova, Histórico) em `flex-wrap` que se empilham e sobrepõem em viewports menores (~1020px). A screenshot mostra "Tela cheia" e "Buscar" sobrepostos.

## Mudanças

### 1. `src/pages/ChatGPT.tsx` — Reorganizar header e garantir banner
- Mover botões secundários (Histórico, Nova) para um dropdown menu com ícone `...` (MoreVertical), mantendo apenas os essenciais visíveis: Como usar, Tela cheia, Finalizar
- Adicionar `sessionChecked &&` à condição do banner para evitar flash
- Garantir que o banner aparece ACIMA dos cards de performance

### 2. `src/pages/ClinicalSimulation.tsx` — Mesma limpeza de header
- Agrupar botões secundários em dropdown para evitar sobreposição

### 3. `src/pages/AnamnesisTrainer.tsx` — Mesma limpeza
- Agrupar botões em dropdown

### 4. `src/pages/ExamSimulator.tsx` — Mesma limpeza
- Agrupar botões em dropdown

### 5. `src/pages/Flashcards.tsx` — Mesma limpeza
- Agrupar botões em dropdown

### 6. `src/pages/StudySession.tsx` — Mesma limpeza
- Agrupar botões em dropdown

## Padrão de Solução (aplicado em todos)

```text
Header: [Título] .................. [Como usar] [Tela cheia] [Finalizar] [⋮]
                                                                          └─ Nova sessão
                                                                             Histórico
                                                                             Configurações
```

- Botões primários (máximo 3) ficam visíveis
- Botões secundários vão para `DropdownMenu` com ícone `MoreVertical`
- Em mobile, labels de texto ficam `hidden` (só ícones)

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ChatGPT.tsx` | Dropdown para botões secundários, fix banner condition |
| `src/pages/ClinicalSimulation.tsx` | Dropdown para botões secundários |
| `src/pages/AnamnesisTrainer.tsx` | Dropdown para botões secundários |
| `src/pages/ExamSimulator.tsx` | Dropdown para botões secundários |
| `src/pages/Flashcards.tsx` | Dropdown para botões secundários |
| `src/pages/StudySession.tsx` | Dropdown para botões secundários |

