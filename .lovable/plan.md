

## Plano: Adicionar universidades do Rio de Janeiro ao cadastro

### Problema
A lista de faculdades está duplicada em 7 arquivos diferentes, cada um com apenas "UNIG", "Estácio" e "Outra". Precisa incluir as principais universidades do RJ e centralizar a lista.

### Solução

**1. Criar arquivo centralizado `src/constants/faculdades.ts`**

Lista completa das universidades do Rio de Janeiro:
- UFRJ, UERJ, UFF, UNIRIO, PUC-Rio, UNIG, Estácio, UniRedentor, UNIFESO, UNESA, Souza Marques, FTESM, IBMR, Universidade Castelo Branco, UNIGRANRIO, Universidade Vassouras, UNIFOA, FMP/Fase, Arthur Sá Earp Neto (FASE), Outra

**2. Atualizar 7 arquivos para importar da constante centralizada**

Remover a declaração local `const FACULDADES = [...]` e substituir por:
```typescript
import { FACULDADES } from "@/constants/faculdades";
```

Arquivos afetados:
- `src/pages/Profile.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/components/professor/VideoRoom.tsx`
- `src/components/professor/ProfessorPlantao.tsx`
- `src/components/professor/StudentTracker.tsx`
- `src/components/professor/ClassAnalytics.tsx`
- `src/pages/ProfessorDashboard.tsx`

### Detalhes técnicos
- Nenhuma mudança no banco de dados necessária (campo `faculdade` é texto livre)
- A lista será ordenada alfabeticamente, com "Outra" sempre por último
- Sem impacto em dados existentes

