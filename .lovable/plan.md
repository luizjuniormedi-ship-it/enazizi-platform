

# Processar DOCX Aqui + Deduplicar com Banco Existente

## O Que Fazer

Usar um script local que:
1. Envia cada **page screenshot** do DOCX para o Gemini 2.5 Pro (multimodal) para extrair questões estruturadas + identificar quais imagens pertencem a cada questão
2. Faz **upload das imagens** extraídas do DOCX para o bucket `question-images`
3. Para cada questão extraída, **busca duplicata** no `questions_bank` comparando os primeiros 80 caracteres do `statement` (fuzzy match com `ilike`)
4. Se encontrar duplicata: **UPDATE** para adicionar `image_url` à questão existente
5. Se não encontrar: **INSERT** nova questão com `image_url` preenchido

## Fluxo Técnico

```text
Para cada página (1-10+):
  1. Ler page screenshot (page_N.jpg) já parseado
  2. Enviar para Gemini Vision → extrair questões + mapear imagens
  3. Para cada questão com imagem:
     a. Upload imagem para bucket question-images
     b. Gerar URL pública
     c. Buscar statement similar no DB (primeiros 80 chars)
     d. Se match → UPDATE image_url
     e. Se novo → INSERT completo
```

## Script

Um único script Python que:
- Usa a API do Lovable AI Gateway (Gemini 2.5 Pro) para analisar os screenshots
- Usa psql para buscar duplicatas e inserir/atualizar
- Usa curl para upload ao storage bucket
- Processa todas as páginas do DOCX parseado

## Resultado Esperado

- Questões existentes no banco ganham `image_url` (ECGs, radiografias, espirometrias)
- Questões novas são inseridas com imagem vinculada
- Zero duplicatas criadas

