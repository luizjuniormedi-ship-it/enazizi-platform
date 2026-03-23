

# Plano: Mini-Revisão Aparece Apenas Após Responder

## Problema

O prompt do `question-generator` instrui a IA a mostrar uma "📚 Mini-revisão do tema" ANTES das questões, o que entrega dicas e essencialmente revela a resposta ao aluno antes dele responder.

## Mudança

**Arquivo:** `supabase/functions/question-generator/index.ts`

Alterar o prompt do sistema para:

1. **Remover** as instruções que mandam gerar mini-revisão antes das questões (linhas 42-43 e 46)
2. **Mover** a mini-revisão para APÓS o gabarito — incluir na seção de "Explicação" uma revisão rápida do tema
3. Manter a regra "QUANDO O ALUNO ERRAR" (linhas 50-54) que já mostra revisão pós-resposta

Especificamente:
- Linha 42: remover "NUNCA iniciar com questões diretas. SEMPRE contextualize o tema primeiro com uma breve revisão."
- Linha 43: remover "Antes de gerar questões, forneça um mini-resumo do tema (3-5 linhas) para situar o aluno."
- Linha 46: remover "📚 Mini-revisão do tema (explicação leiga + pontos-chave)" da estrutura obrigatória
- Adicionar na seção de explicação: "Incluir 📚 Mini-revisão do tema (3-5 linhas) DENTRO da explicação de cada questão, APÓS o gabarito"

