

# Plano: Adicionar Bibliografia por Especialidade aos Geradores

## Objetivo

Incorporar a tabela de livros por especialidade (Braunwald, Murray & Nadel, Adams & Victor, etc.) em todos os pontos de geracao de conteudo: question-generator, generate-flashcards, daily-question-generator, diagnostic, e o prompt compartilhado enazizi-prompt.

## Implementacao

### 1. Criar mapa de bibliografia em `supabase/functions/_shared/specialty-bibliography.ts`

Novo arquivo exportando um `Record<string, string>` mapeando cada especialidade aos seus livros de referencia. Centraliza a informacao para ser reutilizada por todas as edge functions.

Conteudo: as 22 especialidades da tabela enviada (Cardiologia → Braunwald + SOCESP, Pneumologia → Murray & Nadel + Tarantino, etc.).

Funcao utilitaria `getBibliographyForSpecialty(specialty: string): string` que retorna a linha de referencia ou string vazia se nao encontrar.

### 2. Atualizar `supabase/functions/_shared/enazizi-prompt.ts`

Na secao "FONTES PERMITIDAS" (linhas 609-634), adicionar um novo bloco **CICLO CLINICO POR ESPECIALIDADE** com todas as 22 areas e seus livros, entre o bloco "CICLO CLINICO E INTERNATO" e "DIRETRIZES".

### 3. Atualizar `supabase/functions/daily-question-generator/index.ts`

No prompt de geracao (linha ~72), adicionar apos as regras:
```
BIBLIOGRAFIA DE REFERÊNCIA OBRIGATÓRIA para ${specialty}:
${getBibliographyForSpecialty(specialty)}
Use estes livros como base para o conteudo e cite-os nas explicacoes.
```

### 4. Atualizar `supabase/functions/question-generator/index.ts`

Na secao "FONTES DE REFERENCIA" (linhas 83-88), expandir com o bloco completo de bibliografia por especialidade, instruindo a IA a usar os livros especificos da area solicitada.

### 5. Atualizar `supabase/functions/generate-flashcards/index.ts`

Na secao "FONTES DE REFERENCIA" (linhas 111-115), adicionar o mesmo bloco expandido de bibliografia por especialidade.

### 6. Atualizar `src/pages/Diagnostic.tsx`

No prompt do diagnostico (linha ~92), adicionar instrucao de referencia bibliografica importando o mapa inline (ja que e frontend, sera uma const local com o mesmo mapeamento).

## Arquivos modificados

- **Criado**: `supabase/functions/_shared/specialty-bibliography.ts`
- **Editado**: `supabase/functions/_shared/enazizi-prompt.ts`
- **Editado**: `supabase/functions/daily-question-generator/index.ts`
- **Editado**: `supabase/functions/question-generator/index.ts`
- **Editado**: `supabase/functions/generate-flashcards/index.ts`
- **Editado**: `src/pages/Diagnostic.tsx`

## Impacto

Apenas prompts de IA. Nenhuma migracao de banco. Todas as edge functions modificadas serao redeployadas automaticamente.

