

# Plano: Priorizar Internato e Ciclo Clinico na geracao diaria

## Situacao atual
O `daily-question-generator` seleciona as 2 especialidades com **menos questoes** no banco, sem considerar ciclo academico. Isso distribui igualmente entre Basico, Clinico e Internato.

## Mudanca proposta

### Editar `supabase/functions/daily-question-generator/index.ts`

**Adicionar sistema de peso por ciclo:**

1. Definir os ciclos com pesos:
   - Internato (Cirurgia, GO, Emergencia, Preventiva, Pediatria, Terapia Intensiva): peso **3x** (aparecem com muito mais frequencia)
   - Ciclo Clinico (Cardio, Neuro, Dermato, etc.): peso **2x**
   - Ciclo Basico (Anatomia, Bioquimica, etc.): peso **1x**

2. Na selecao das especialidades (linhas 374-385), em vez de ordenar apenas por contagem, dividir a contagem pelo peso do ciclo. Assim especialidades de Internato e Clinico precisam de **mais questoes** para nao serem priorizadas.

3. Selecionar **3 especialidades** por execucao (em vez de 2): garantir que pelo menos 1 seja Internato e 1 seja Clinico.

### Logica simplificada
```text
score = count / weight
Internato:  100 questoes / 3 = score 33 (priorizado)
Clinico:    100 questoes / 2 = score 50
Basico:     100 questoes / 1 = score 100 (deprioritizado)
```

## Arquivo
- Editar + deploy: `supabase/functions/daily-question-generator/index.ts`

