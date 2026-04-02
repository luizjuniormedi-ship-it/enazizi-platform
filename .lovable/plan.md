

# Remover Nomes de Cursinhos dos Filtros (Manter Busca)

## Resumo
Manter os domínios de cursinhos como fontes de busca no backend (para capturar questões), mas remover os nomes visíveis no painel admin e nos filtros que o usuário vê.

## Alterações

### 1. `src/components/admin/AdminIngestionPanel.tsx`
- Remover os nomes "Medway" das URLs exibidas no `ENARE_SOURCES` — renomear para apenas "ENARE 2025 - Objetiva R1" (já está assim, mas as URLs do S3 Medway ficam visíveis ao clicar). Manter as URLs funcionais mas trocar o placeholder do input de `https://www.medway.com.br/...` para `https://exemplo.com/prova.pdf`
- Linha 432: trocar placeholder

### 2. `supabase/functions/search-real-questions/index.ts`
- **TRUSTED_DOMAINS** (linhas 30-32): Manter os domínios na lista (para aceitar resultados deles), mas isso é backend invisível ao usuário — **nenhuma mudança necessária aqui**
- **buildQueryPool** (linhas 115-120, 134-135): As queries `site:medway.com.br`, `site:sanarmed.com`, etc. são apenas termos de busca no Google — **manter para continuar capturando questões**

### 3. Verificar se há filtros visíveis ao usuário com nomes de cursinhos
Verificar se tabelas `questions_bank` ou `real_exam_questions` armazenam "Medway", "Estratégia" etc. nos campos `banca` ou `source` que aparecem em filtros do frontend.

## Conclusão
A única mudança de código necessária é trocar o placeholder no `AdminIngestionPanel.tsx`. Os domínios no backend continuam funcionando mas não aparecem para o usuário final. Se houver dados já salvos no banco com nomes de cursinhos nos campos de filtro, será necessária uma migração para limpar esses valores.

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/AdminIngestionPanel.tsx` | Trocar placeholder de URL visível |

