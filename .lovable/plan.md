

## Plano: Usar OpenAI no gerador + Criar banco de casos clínicos

### Contexto

O `enamed-generator` usa `aiFetch` que tenta o Lovable Gateway primeiro e cai para OpenAI como fallback. O pedido é inverter: usar OpenAI diretamente (como o Tutor IA já faz) para maior qualidade. Além disso, criar uma tabela `clinical_cases` para armazenar casos clínicos estruturados gerados pela IA.

---

### 1. Alterar `enamed-generator` para usar OpenAI diretamente

**Arquivo**: `supabase/functions/enamed-generator/index.ts`

- Substituir `aiFetch` por chamada direta à API OpenAI (`gpt-4o`) com fallback manual para Lovable Gateway
- Mesmo padrão já usado no `chatgpt-agent`
- Adicionar geração de **casos clínicos** ao prompt (além de questões e flashcards)
- Inserir casos clínicos na nova tabela `clinical_cases`

### 2. Criar tabela `clinical_cases`

**Migration SQL**:

```sql
CREATE TABLE public.clinical_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  specialty text NOT NULL,
  title text NOT NULL,
  clinical_history text NOT NULL,
  vitals jsonb DEFAULT '{}'::jsonb,
  physical_exam text,
  lab_results jsonb DEFAULT '[]'::jsonb,
  imaging text,
  correct_diagnosis text NOT NULL,
  differential_diagnoses jsonb DEFAULT '[]'::jsonb,
  treatment text,
  explanation text,
  difficulty integer DEFAULT 3,
  source text,
  is_global boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read clinical cases"
  ON public.clinical_cases FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can CRUD own clinical cases"
  ON public.clinical_cases FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 3. Atualizar o prompt do gerador

Expandir o prompt para gerar **10 casos clínicos estruturados** por especialidade, além das 30 questões e 20 flashcards. Cada caso terá: história, sinais vitais, exame físico, exames, diagnóstico correto, diferenciais e conduta.

### 4. Atualizar `ai-fetch.ts` (opcional)

Manter como está -- o `enamed-generator` passará a fazer chamada direta à OpenAI, sem usar `aiFetch`.

---

### Resumo de arquivos alterados

| Arquivo | Ação |
|---|---|
| `supabase/functions/enamed-generator/index.ts` | Chamar OpenAI diretamente + gerar casos clínicos |
| Migration SQL | Criar tabela `clinical_cases` com RLS |

