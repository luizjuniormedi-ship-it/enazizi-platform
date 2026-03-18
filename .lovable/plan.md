

## Plano: Biblioteca Médica Interligada (AMBOSS-style)

### Resumo
Criar um sistema onde termos médicos em textos da plataforma (questões, flashcards, explicações) ficam clicáveis. Ao clicar, um painel lateral abre com explicação completa gerada por IA, com cache no banco para evitar chamadas repetidas.

### 1. Banco de Dados — Tabela `medical_terms`

Migration SQL para criar a tabela de cache de termos:

```sql
CREATE TABLE public.medical_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  aliases text[] DEFAULT '{}',
  specialty text,
  definition_json jsonb,  -- cache: { definicao, fisiopatologia, diagnostico, tratamento, fontes }
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(term)
);

ALTER TABLE public.medical_terms ENABLE ROW LEVEL SECURITY;

-- Todos authenticated podem ler
CREATE POLICY "Authenticated can read terms"
ON public.medical_terms FOR SELECT TO authenticated
USING (true);

-- Admins podem gerenciar
CREATE POLICY "Admins can manage terms"
ON public.medical_terms FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### 2. Edge Function — `medical-term-lookup`

- Recebe `{ term: string }` via POST
- Busca cache na tabela `medical_terms` via service role
- Se encontrar `definition_json` preenchido, retorna direto
- Se nao, chama Lovable AI (Gemini 2.5 Flash) com prompt estruturado para gerar explicacao medica
- Usa tool calling para extrair JSON estruturado: `{ definicao, fisiopatologia, diagnostico, tratamento, fontes }`
- Salva no cache (upsert) e retorna
- Usa o helper `aiFetch` existente em `_shared/ai-fetch.ts`
- `verify_jwt = false` no config.toml, validação manual do token

### 3. Componente `MedicalTermHighlighter`

- Componente React que recebe `text: string` como prop
- Mantém um dicionário local de ~200 termos médicos frequentes (hardcoded no frontend como constante, sem necessidade de fetch da tabela a cada render)
- Usa regex para detectar termos no texto
- Renderiza matches como `<span>` com estilo sublinhado pontilhado + cursor pointer
- Ao clicar, dispara callback `onTermClick(term)`
- Termos não-match renderizam como texto normal

### 4. Componente `MedicalTermPanel`

- Usa o componente `Sheet` (lateral direito) já existente
- Estado controlado por contexto React (`MedicalTermContext`) para que qualquer componente na árvore possa abrir o painel
- Exibe: titulo do termo, especialidade, definição, fisiopatologia, diagnóstico, tratamento, fontes
- Estado de loading enquanto busca da edge function
- Cache local em memória (Map) para sessão atual

### 5. Contexto React — `MedicalTermProvider`

- Novo provider `src/contexts/MedicalTermContext.tsx`
- Expõe `openTerm(term: string)` e o Sheet do painel
- Adicionado no `App.tsx` envolvendo as rotas
- Qualquer componente pode chamar `useMedicalTerm().openTerm("insuficiência cardíaca")`

### 6. Integração nos Módulos

Envolver textos com `MedicalTermHighlighter` em:
- `InteractiveQuestionCard` — enunciado e explicação
- `QuestionsBank` — enunciado das questões
- `Flashcards` — pergunta e resposta
- `StudySession` — conteúdo das mensagens do assistente

### 7. Lista Inicial de Termos

Hardcoded array com ~200 termos das especialidades cobertas (Cardiologia, Pneumologia, Neurologia, Pediatria, Cirurgia, GO, Preventiva, etc.). Exemplos: "insuficiência cardíaca", "diabetes mellitus", "hipertensão arterial", "pneumonia", "meningite", "apendicite", "pré-eclâmpsia", "asma", "DPOC", "AVC", etc.

### Etapas de Implementação

1. Criar migration da tabela `medical_terms`
2. Criar edge function `medical-term-lookup` com IA + cache
3. Criar `MedicalTermContext` + `MedicalTermPanel`
4. Criar `MedicalTermHighlighter`
5. Integrar nos 4 módulos principais
6. Atualizar `config.toml` com a nova function

