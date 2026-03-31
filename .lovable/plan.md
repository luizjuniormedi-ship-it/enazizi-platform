

# Processar DOCX com Imagens para o Banco de Questões

## Análise do Documento

O DOCX contém ~30+ questões de Cardiologia (concursos/residência) com muitas imagens embutidas (ECGs, radiografias, espirometrias). O parser extraiu ~150+ imagens das páginas. As questões têm estrutura variada -- algumas com alternativas claras (A-E), outras com texto corrido.

## Desafio Principal

As imagens são parte integral das questões (ECGs para interpretar, radiografias para diagnosticar). Para incluí-las no banco, precisamos:

1. **Armazenar as imagens** no storage (bucket `user-uploads` ou novo bucket `question-images`)
2. **Vincular cada imagem à questão** usando a coluna `image_url` recém-criada
3. **Exibir as imagens** no frontend do Banco de Questões

## Plano

### 1. Criar Edge Function `process-docx-questions`

Nova edge function que:
- Recebe o DOCX via upload ou referência ao storage
- Usa IA (Gemini 2.5 Pro -- melhor para imagem+texto) para analisar cada página como screenshot
- A IA recebe o screenshot da página e extrai as questões estruturadas com indicação de quais imagens pertencem a qual questão
- Faz upload das imagens relevantes para o bucket `question-images` (público)
- Insere as questões no `questions_bank` com `image_url` preenchido

### 2. Migração SQL

- Criar bucket `question-images` (público, para servir imagens nas questões)

### 3. Atualizar Frontend (`QuestionsBank.tsx`)

- Renderizar `image_url` quando presente na questão (tag `<img>` abaixo do enunciado)
- Manter filtro de 4-5 alternativas

### 4. Fluxo de Processamento

```text
DOCX Upload → parse_document (páginas como screenshots)
    → Gemini 2.5 Pro analisa cada screenshot
    → Extrai: enunciado, alternativas, gabarito, identifica imagens
    → Upload imagens → Storage (question-images bucket)
    → Insert questões com image_url → questions_bank
```

### 5. Admin: Botão "Processar DOCX com Imagens"

No `AdminUploadsPanel.tsx`, adicionar botão para disparar a nova edge function em uploads DOCX.

## Arquivos Impactados

- `supabase/functions/process-docx-questions/index.ts` -- nova edge function
- 1 migração SQL (bucket `question-images`)
- `src/pages/QuestionsBank.tsx` -- exibir imagens
- `src/components/admin/AdminUploadsPanel.tsx` -- botão de processamento

## Observação Técnica

O Gemini 2.5 Pro é ideal aqui porque consegue analisar screenshots das páginas do DOCX e extrair tanto texto quanto contexto visual (qual imagem pertence a qual questão), algo impossível com extração puramente textual.

