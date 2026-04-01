

# Testar Pipeline de Extração Visual — IDOMED 2026

## Contexto

O PDF `TP_IDOMED_PRESENCIAL_2026_1.pdf` (upload ID: `380f0936-70e1-438b-9b1d-6f320c77c3f0`) extraiu apenas **8 questões** no pipeline de texto. Provavelmente muitas foram descartadas por conterem imagens médicas. É o candidato ideal para testar o novo `extract-exam-visual`.

## Execução

### 1. Deploy da Edge Function

Fazer deploy do `extract-exam-visual` que já foi criado mas pode não estar deployado ainda.

### 2. Invocar a Function

Chamar `extract-exam-visual` com o `upload_id` do IDOMED:
```json
{ "upload_id": "380f0936-70e1-438b-9b1d-6f320c77c3f0" }
```

### 3. Verificar Resultados

- Checar logs da function para erros
- Consultar `questions_bank` para novas questões com `image_url` preenchida
- Verificar se o PDF foi uploadado no bucket `question-images`

### 4. Ajustar se Necessário

Se houver erros (tamanho do PDF, timeout, formato base64), corrigir a function e re-deployar.

### Resultado Esperado

- Questões extraídas com `has_image = true` terão `image_url` apontando para o PDF com âncora de página (ex: `...pdf#page=3`)
- Questões inseridas com `review_status: 'pending'` para auditoria

