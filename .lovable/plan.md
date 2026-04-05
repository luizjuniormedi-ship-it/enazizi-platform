

# Plano: Deletar Questões Administrativas + Blindar Pipeline

## Problema
92 questões do `hrpp_edital2026.pdf` são sobre processo seletivo, taxas, documentação — zero conteúdo clínico. O filtro atual não bloqueia termos administrativos.

## Ações

### 1. Deletar questões do edital (SQL via insert tool)
- Deletar todas as 92 questões com `source = 'upload:hrpp_edital2026.pdf'`
- Deletar o registro do upload na tabela `uploads`
- Remover o arquivo do storage `user-uploads`

### 2. Expandir `NON_MEDICAL_CONTENT_REGEX` — client-side
**`src/lib/medicalValidation.ts`** — adicionar termos administrativos:
```
taxa de inscri|processo seletivo|período de inscrição|
edital de convoca|cronograma do processo|matrícula dos aprovados|
homologa[cç][aã]o|classificação final|prazo de recurso|
resultado preliminar|documentação exigida|valor da taxa|
vagas reservadas|candidato inscrito|prova objetiva do processo
```

### 3. Expandir `NON_MEDICAL_CONTENT_REGEX` — edge function
**`supabase/functions/process-upload/index.ts`** — mesmos termos administrativos no regex da linha 11

### 4. Melhorar prompt de validação médica
No step de validação (aiFetch com gemini-flash-lite), instruir explicitamente:
- "Editais, regulamentos de processo seletivo, cronogramas e documentos administrativos NÃO são conteúdo médico"

### 5. Adicionar filtro de comprimento mínimo
No step de geração de questões, rejeitar `statement.length < 120` (conforme padrão já definido nas memórias do projeto)

## O que NÃO muda
- Study Engine, Dashboard, MissionEntry
- Questões clínicas existentes
- Lógica de flashcards

