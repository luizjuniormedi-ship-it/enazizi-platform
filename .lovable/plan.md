

# Plano: Incluir Medicina Baseada em Evidências no TutorZizi

## Mudança

Inserir uma nova seção "MEDICINA BASEADA EM EVIDÊNCIAS" no prompt base (`enazizi-prompt.ts`) após a seção "RACIOCÍNIO CLÍNICO" (linha 407), instruindo o tutor a fundamentar condutas com níveis de evidência e graus de recomendação.

## Conteúdo a inserir

A seção incluirá:
- Classificação de níveis de evidência (1A meta-análise, 1B ECR, 2A coorte, 2B caso-controle, etc.)
- Graus de recomendação (I, IIa, IIb, III) com significado prático
- Instrução para citar nível de evidência em toda conduta terapêutica
- Pirâmide de evidências para priorização de fontes
- Orientação para leitura crítica (tipo de estudo, viés, aplicabilidade)

## Arquivo

| Arquivo | Mudança |
|---|---|
| `supabase/functions/_shared/enazizi-prompt.ts` | Inserir ~25 linhas de seção MBE após linha 407 (entre "RACIOCÍNIO CLÍNICO" e "METODOLOGIA DE APRENDIZADO") |

## Impacto

Todos os agentes que usam o prompt base (TutorZizi, MentorMed, Chat Livre) passarão a incluir fundamentação em evidências nas explicações, sem alterar o fluxo pedagógico existente.

