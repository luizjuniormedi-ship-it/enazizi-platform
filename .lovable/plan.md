

# Plano: 6 Melhorias Estruturais no Tutor IA

## Problemas Identificados

1. **Repetição espaçada inexistente**: O tutor não tem memória de temas já ensinados — pode repetir o mesmo conteúdo da mesma forma
2. **Questões objetivas sem variação de paciente**: O prompt não proíbe repetir perfil demográfico nos casos clínicos
3. **Sem controle de profundidade por nível**: O `getLevelPrompt` existe mas não ajusta a ESTRUTURA do bloco (apenas linguagem)
4. **Active recall não alimenta repetição futura**: Erros no recall não geram reforço nos blocos seguintes
5. **Histórico de sessão não persiste temas**: `studiedTopics` usa localStorage em vez do banco
6. **Prompt muito longo** (~630 linhas): Risco de a IA ignorar instruções no final — as verificações obrigatórias ficam nas últimas linhas

## Mudanças Propostas

### 1. Repetição Espaçada no Prompt (`enazizi-prompt.ts`)

Adicionar regra de espaçamento entre blocos:
- PODE repetir tema, mas com pelo menos 2 blocos de intervalo
- Quando repetir, OBRIGATORIAMENTE usar enfoque diferente (diagnóstico → tratamento → complicações)
- NUNCA repetir o mesmo conceito em blocos consecutivos

### 2. Anamnese Única por Questão (`enazizi-prompt.ts` + `study-session/index.ts`)

Adicionar no phase `questions`:
- NUNCA repetir perfil de paciente (idade/sexo/cenário) em questões da mesma sessão
- Variar: nomes regionais brasileiros, idades de 0-95 anos, profissões diversas
- Alternar cenários: PS, enfermaria, UTI, UBS, SAMU, ambulatório

### 3. Reforço Automático por Erro no Recall (`study-session/index.ts`)

Quando o aluno errar no active recall:
- Incluir no prompt da próxima fase que o aluno errou conceito X
- Nos próximos 3-5 blocos, o tema deve reaparecer com enfoque diferente
- Enviar `weakTopics` atualizado em tempo real no `performanceData`

### 4. Migrar `studiedTopics` para `temas_estudados` (`StudySession.tsx`)

- Substituir `localStorage.getItem('enazizi-studied-...')` por INSERT/SELECT em `temas_estudados`
- Ao iniciar tema: inserir registro com `fonte: 'tutor-ia'`
- Ao carregar: buscar temas do banco em vez do localStorage

### 5. Reorganizar Prompt — Verificações no Topo (`enazizi-prompt.ts`)

Mover as 9 verificações obrigatórias (linhas 576-590) para LOGO APÓS a identidade do tutor:
- Modelos de IA tendem a seguir melhor instruções no início do prompt
- Manter uma cópia resumida no final como reforço

### 6. Casos Discursivos com Não-Repetição (`study-session/index.ts`)

Atualizar phase `discursive` com mesma regra de variação:
- Nunca repetir perfil de paciente do caso anterior
- Variar cenários clínicos e comorbidades
- Quando aluno errou tema: retomar nos próximos 3-5 casos com ângulo diferente

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/_shared/enazizi-prompt.ts` | Regras de repetição espaçada, anamnese única, reorganização do prompt |
| `supabase/functions/study-session/index.ts` | Reforço por erro, variação de pacientes em MCQ e discursivas |
| `src/pages/StudySession.tsx` | Migrar studiedTopics de localStorage para banco `temas_estudados` |

## Resultado Esperado

- Aprendizado com repetição inteligente (não repete igual, varia o ângulo)
- Questões com pacientes únicos (sem "sempre homem 55 anos hipertenso")
- Erros no recall geram reforço automático nos blocos seguintes
- Histórico de estudo persistido no banco (não perde ao limpar cache)
- Prompt mais eficiente (verificações no início = mais compliance da IA)

