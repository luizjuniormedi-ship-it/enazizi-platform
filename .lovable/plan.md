

# Plano: Melhorar módulo Simulados

## Problemas atuais

1. **Quantidade inexata**: O `generateBatch` pede X questões mas a IA pode retornar menos. O retry ajuda mas nem sempre resolve
2. **Prompt fraco**: O prompt é genérico ("Gere X questões...") sem instruções de formato JSON estruturado, casos clínicos detalhados, ou distribuição por tema
3. **Erro silencioso em lotes**: Batches que falham são ignorados sem feedback ao usuário
4. **Progresso vago**: Loading mostra apenas "Gerando questões..." sem indicar quantas já foram geradas
5. **Deduplicação inexistente**: Múltiplos batches podem gerar questões repetidas

## Melhorias propostas

### Editar `src/pages/Simulados.tsx`

**1. Prompt mais rigoroso no `generateBatch`**
- Instruir a IA a retornar JSON puro (sem markdown)
- Exigir distribuição proporcional por tema (ex: 3 temas, 10 questões = ~3-4 por tema)
- Pedir caso clínico com dados do paciente (idade, sexo, queixa, exames) em cada questão
- Exigir explicação com referência bibliográfica

**2. Progresso detalhado**
- Mostrar "Geradas 7/10 questões..." atualizando conforme batches completam
- Barra de progresso visual em vez de apenas texto

**3. Deduplicação**
- Após juntar todos os batches, filtrar questões com enunciados muito similares (comparação por primeiros 80 caracteres)

**4. Retry inteligente**
- Se após 2 tentativas ainda faltar questões, informar ao usuário quantas foram geradas e perguntar se quer continuar com o que tem

**5. Validação do `correct_index`**
- Verificar que `correct_index` está dentro do range de opções (0 a options.length-1), evitando gabarito inválido

### Arquivo
- Editar: `src/pages/Simulados.tsx`

