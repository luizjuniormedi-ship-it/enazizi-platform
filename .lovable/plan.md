

# Adicionar Seção Obrigatória de Fisiopatologia no Prompt do Tutor IA

## Problema

A estrutura atual do prompt pula de "Explicação simples" e "Mecanismos principais" direto para "Consequências clínicas". Falta uma seção dedicada de **fisiopatologia** que explique o "porquê" molecular/celular/hemodinâmico das doenças — essencial para provas de residência.

## Plano

### 1. Inserir seção 🔬 FISIOPATOLOGIA na estrutura obrigatória

No arquivo `supabase/functions/_shared/enazizi-prompt.ts`:

- Renumerar os passos da "ESTRUTURA OBRIGATÓRIA DAS EXPLICAÇÕES" (linhas 70-129)
- Inserir entre o passo 1 (Explicação simples) e o atual passo 2 (Mecanismos principais) uma nova seção:

```
2️⃣ 🔬 Fisiopatologia
Explicar o mecanismo fisiopatológico em profundidade:
- Via molecular ou celular envolvida
- Cascata inflamatória, hemodinâmica ou metabólica
- Alterações histopatológicas quando relevante
- Conexão entre fisiopatologia e manifestações clínicas

Formato:
🔬 FISIOPATOLOGIA
Mecanismo central: [descrição]
→ [etapa 1 da cascata]
→ [etapa 2]
→ [resultado clínico]

Referências: citar base (Guyton, Robbins, Harrison) quando aplicável.
```

### 2. Atualizar sequência de entrega (blocos atômicos)

- Linha 36: Incluir 🔬 FISIOPATOLOGIA na Mensagem 1 junto com explicação técnica
- Ajuste: `Mensagem 1: 💡 EXPLICAÇÃO PARA LEIGO + 🔬 FISIOPATOLOGIA + 🔬 EXPLICAÇÃO TÉCNICA`

### Arquivo modificado

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/_shared/enazizi-prompt.ts` | Adicionar seção fisiopatologia obrigatória + renumerar passos |

