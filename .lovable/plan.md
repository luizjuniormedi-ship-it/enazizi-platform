

# Plano: Completar Método Pedagógico — Fisiopatologia Profunda + Eventos Adversos

## Problemas Atuais

1. **Fisiopatologia genérica**: O prompt pede "mecanismo central → etapas → resultado clínico" mas não exige vias moleculares, mediadores específicos nem correlação direta sintoma↔mecanismo
2. **Eventos adversos inexistentes**: Não há seção obrigatória sobre efeitos colaterais, interações medicamentosas e contraindicações na estrutura de ensino

## Mudanças

### 1. `supabase/functions/_shared/enazizi-prompt.ts`

**A) Expandir seção 2️⃣ Fisiopatologia (linhas 77-91)**

Tornar obrigatório:
- Mediadores específicos (IL-6, TNF-α, bradicinina, etc.)
- Receptores e transportadores envolvidos
- Cascata completa com setas: gatilho → mediador → órgão-alvo → manifestação
- Correlação explícita fisiopatologia ↔ sintoma (ex: "edema PORQUE ↑ pressão hidrostática")
- Referência a Guyton/Robbins/Harrison obrigatória

Novo formato:
```text
🔬 FISIOPATOLOGIA DETALHADA
Gatilho: [evento inicial]
→ Mediador: [citocina/hormônio/enzima específica]
→ Via: [receptor ou via de sinalização]
→ Órgão-alvo: [tecido afetado + alteração]
→ Resultado clínico: [sintoma] PORQUE [mecanismo direto]
```

**B) Adicionar nova seção obrigatória: 💊⚠️ EVENTOS ADVERSOS**

Inserir entre `💊 CONDUTA CLÍNICA` e `🔀 DIAGNÓSTICOS DIFERENCIAIS` no Marcador de Bloco (linha 280-283):

```text
💊⚠️ EVENTOS ADVERSOS E SEGURANÇA
- Efeitos adversos COMUNS (>10%) vs GRAVES/RAROS (<1%)
- Mecanismo do efeito adverso (por que ocorre)
- Interações medicamentosas relevantes (CYP450, potássio, etc.)
- Contraindicações absolutas e relativas
- Sinais de alerta para suspensão
- Manejo dos efeitos adversos mais comuns
- Monitorização laboratorial necessária
```

**C) Atualizar sequência de entrega (linhas 36-43)**

Mensagem 2 passa a incluir eventos adversos:
```text
Mensagem 2: 🏥 APLICAÇÃO CLÍNICA + 💊 CONDUTA + 💊⚠️ EVENTOS ADVERSOS + 🔀 DIFERENCIAIS
```

**D) Atualizar verificação final (linhas 531-544)**

Adicionar item 8: "Os eventos adversos dos medicamentos foram listados"

**E) Atualizar exemplo de formato (linhas 218-259)**

Adicionar exemplo de eventos adversos após conduta no modelo de IC

### 2. `supabase/functions/study-session/index.ts`

Atualizar o phase prompt `lesson` para incluir:
- Fisiopatologia com mediadores moleculares obrigatórios
- Eventos adversos como componente obrigatório do bloco

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/_shared/enazizi-prompt.ts` | Fisiopatologia expandida + seção Eventos Adversos + verificação final |
| `supabase/functions/study-session/index.ts` | Phase prompt `lesson` com novos requisitos |

## Resultado Esperado

- Fisiopatologia com cascatas moleculares claras e correlação direta com sintomas
- Toda conduta terapêutica seguida de efeitos adversos, interações e contraindicações
- Aluno aprende "o que tratar" + "o que vigiar" + "por que esse efeito ocorre"

