

# Plano: Simulados mais Didatico e Eficiente

## Problemas atuais

1. **Zero feedback durante o exame** — o aluno responde e não sabe se acertou até o final
2. **Explicações só no resultado final** — e mesmo assim, apenas o campo `explanation` curto
3. **Sem modo estudo** — só existe modo "prova cronometrada", sem opção de aprender enquanto pratica
4. **Resultado superficial** — mostra % por area mas não oferece plano de ação
5. **Sem marcação de questões** — não dá para marcar dúvidas para revisão posterior

## Melhorias propostas

### 1. Modo Estudo vs Modo Prova (SimuladoSetup)
Adicionar toggle na configuração:
- **Modo Prova** (atual): cronômetro, sem feedback, resultado no final
- **Modo Estudo**: sem cronômetro, ao responder mostra imediatamente se acertou/errou com explicação detalhada, botão "Estudar com Tutor IA" em cada questão

### 2. Feedback imediato no Modo Estudo (SimuladoExam)
Após selecionar uma alternativa no modo estudo:
- Alternativa correta fica verde, errada fica vermelha
- Exibe a explicação da questão abaixo das opções
- Botão "Estudar com Tutor IA" para aprofundar
- Só permite avançar após responder (lock de alternativas)
- Contador de acertos/erros visível no header

### 3. Marcar questões para revisão (SimuladoExam)
- Botão de bookmark/flag em cada questão (ambos os modos)
- Questões marcadas ficam com indicador amarelo na grade numérica
- No resultado, seção separada "Questões Marcadas para Revisão"

### 4. Resultado com plano de ação (SimuladoResult)
- **Diagnóstico por area**: abaixo de 60% = "Crítico — estude urgente", 60-80% = "Revisar", 80%+ = "Dominado"
- **Recomendação automática**: botão "Gerar Guia de Estudo" para cada area fraca (chama a edge function `generate-study-guide`)
- **Tempo médio por questão**: mostrar se o aluno foi rápido demais ou lento demais
- **Comparação com média**: se houver histórico, mostrar evolução

### 5. Explicação expandida nos erros (SimuladoResult)
- Cada erro mostra explicação completa (não truncada)
- Mostra qual alternativa estava errada e por que cada distrator é incorreto
- Botão "Estudar com Tutor IA" já presente, manter

## Arquivos a alterar

| Arquivo | Mudança |
|---|---|
| `SimuladoSetup.tsx` | Toggle Modo Estudo/Prova |
| `SimuladoExam.tsx` | Feedback imediato (modo estudo), flag de questões, timer condicional |
| `SimuladoResult.tsx` | Diagnóstico por area, recomendações, tempo médio, questões marcadas |
| `Simulados.tsx` | Passar `mode` para os componentes, ajustar fluxo |

## Detalhes tecnicoss

- Nova prop `mode: "prova" | "estudo"` passada do Setup ao Exam e Result
- No modo estudo, `timeSeconds` = 0 (sem timer)
- Estado `flaggedQuestions: Set<number>` no Exam, persistido no auto-save
- No Result, calcular `timePerQuestion = totalTime / answeredCount`
- Chamar `generate-study-guide` (edge function existente) para areas com <60%

