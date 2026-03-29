

# Corrigir Pipeline de Busca de Questões Reais

## Problema Raiz
O pipeline coleta candidate blocks e a IA extrai questões, mas a validação pós-IA rejeita TUDO porque:
1. Opções retornadas pela IA não começam exatamente com `A) ` (pode vir `a)`, `A.`, `A -`, ou sem prefixo)
2. Mínimo de 180 caracteres é alto demais — questões reais curtas de 120-170 chars são descartadas
3. A normalização (`normalizeQuestion`) não trata o formato das opções

## Correções no `supabase/functions/search-real-questions/index.ts`

### 1. Adicionar normalização de opções ANTES da validação
Na função `normalizeQuestion`, adicionar lógica para:
- Se opção não começa com `A) `, adicionar o prefixo automaticamente baseado no índice
- Aceitar formatos: `a)`, `A.`, `A -`, `A:`, `(A)`, ou opção sem prefixo

### 2. Relax