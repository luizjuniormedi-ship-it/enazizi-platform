

# Pipeline de Questões com Imagens Reais

## Diagnóstico

| Métrica | Valor |
|---|---|
| Total questões no banco | 7.086 |
| Com image_url real (URL válida) | **0** |
| Com placeholder `[IMG] descrição` | 1 |

### Por que não temos imagens hoje

1. **`extract-exam-questions`** (TXT/PDF texto): Linha 199 — **descarta** toda questão que menciona imagem (`IMAGE_REF_PATTERN.test → filter out`)
2. **`process-docx-questions`** (Vision): Usa Gemini Vision para ler páginas, mas salva apenas `[IMG] descrição textual` em vez de extrair e armazenar a imagem real
3. **Nenhum pipeline** faz: recorte da imagem do PDF → upload no Storage → salva URL pública no `image_url`

## Solução: Pipeline de Extração Visual de Provas

### Fluxo

```text
PDF de prova com imagens
        │
        ▼
  pdftoppm (Edge Function)
  Converte cada página em imagem PNG
        │
        ▼
  Gemini 2.5 Pro Vision
  Analisa cada página e retorna:
  - Questões extraídas (texto + alternativas)
  - Bounding box / região da imagem médica
  - Flag has_image = true
        │
        ▼
  Se has_image = true:
  - Recorta região da imagem da página
  - Upload para bucket "question-images" (público)
  - Salva URL pública no campo image_url
        │
        ▼
  Insert no questions_bank com image_url real
```

### Mudanças

#### 1. Nova Edge Function `extract-exam-visual` 

Substitui o fluxo atual para PDFs com imagens:
- Recebe `uploadId`
- Baixa o PDF do Storage
- Converte páginas em imagens base64 (via `pdftoppm` ou canvas server-side)
- Envia cada página ao Gemini Vision pedindo: questões + coordenadas de imagens
- Para questões com imagem: recorta a região, faz upload ao bucket `question-images`, obtém URL pública
- Insere no `questions_bank` com `image_url` real e `review_status: 'pending'`

**Problema**: Edge Functions (Deno) não têm `pdftoppm`. Alternativa viável:
- Enviar o PDF inteiro como base64 ao Gemini (aceita PDFs nativamente até ~30MB)
- Pedir à IA que retorne a imagem médica em base64 quando detectar uma
- Fazer upload do base64 retornado ao Storage

#### 2. Atualizar `process-docx-questions`

- Em vez de salvar `[IMG] descrição`, pedir ao Gemini que retorne a imagem médica em formato base64
- Fazer upload ao bucket `question-images`
- Salvar URL pública real

#### 3. Atualizar `extract-exam-questions`

- Remover o filtro que descarta questões com referência a imagens (linha 199)
- Manter essas questões mas com `image_url = null` e `review_status = 'pending'`
- Na revisão do admin, permitir upload manual da imagem

#### 4. Botão no Admin: "Extrair Prova Visual"

No `AdminUploadsPanel`, adicionar botão "Extrair com Imagens" que chama a nova function `extract-exam-visual` em vez da `extract-exam-questions` para PDFs que contenham imagens.

#### 5. Frontend: Exibir imagens

`QuestionsBank.tsx` e `Simulados.tsx` já renderizam `image_url` quando é URL válida — sem mudança necessária.

### Arquivos Impactados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/extract-exam-visual/index.ts` | **Novo** — pipeline visual com Gemini PDF nativo |
| `supabase/functions/process-docx-questions/index.ts` | Extrair imagem base64 do Gemini → upload Storage → URL real |
| `supabase/functions/extract-exam-questions/index.ts` | Remover filtro IMAGE_REF (manter questões, marcar pendente) |
| `src/components/admin/AdminUploadsPanel.tsx` | Botão "Extrair com Imagens" para PDFs visuais |

### Limitação

O Gemini Vision consegue **descrever** imagens médicas mas não **retornar o recorte exato** em base64 de forma confiável. A abordagem mais robusta é:
- Converter cada página do PDF em imagem completa (página inteira)
- Quando a IA detecta imagem médica na questão, armazenar a **página inteira** como contexto visual
- Cada questão com imagem recebe o screenshot da página onde aparece

Isso garante fidelidade visual total sem depender de recorte automático.

