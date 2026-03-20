

# Provas Anteriores — Sem Conteúdo Visível

## Problema
O módulo tem **5.307 questões** no banco, mas a lista de bancas é hardcoded (`ENARE`, `USP`, etc.) e não coincide com os nomes reais das fontes no banco de dados (ex: `upload:REVALIDA INEP 2020 OBJETIVA(1).pdf`, `prova:USP-SP-2023-CM`, `AMRIGS 2020`). Além disso, a query só roda quando pelo menos um filtro é selecionado — sem filtro, nada aparece.

## Solução
Tornar as bancas e anos **dinâmicos**, extraídos diretamente do banco, em vez de hardcoded. Também mostrar questões por padrão (sem exigir filtro).

## Alterações em `src/pages/PreviousExams.tsx`

1. **Remover `BANCAS` hardcoded** — extrair bancas únicas dos `source` reais do banco, normalizando nomes (ex: extrair "USP" de `prova:USP-SP-2023-CM`, "Revalida" de `REVALIDA INEP 2020`)

2. **Criar função de normalização de source**:
   - Mapear patterns conhecidos: `Revalida/REVALIDA/revalida` → "Revalida", `USP/FMUSP` → "USP", `UNICAMP` → "UNICAMP", `AMRIGS` → "AMRIGS", `SUS-SP` → "SUS-SP", `HSL` → "Hospital Sírio-Libanês", `PUC` → "PUC-PR", `HSCSP/São Camilo` → "São Camilo", `IDOMED` → "IDOMED"
   - Fallback: usar o source original truncado

3. **Extrair anos dos sources** (regex `\d{4}`) — já funciona, mas depende dos dados corretos

4. **Habilitar query sem filtros** — mudar `enabled` para `true` sempre, com fallback mostrando as 100 questões mais recentes quando nenhum filtro está selecionado

5. **Mostrar contagem real** de questões disponíveis por banca no dropdown (opcional, melhoria UX)

## Resultado
Ao abrir "Provas Anteriores", o usuário verá imediatamente as questões disponíveis e poderá filtrar por bancas reais que existem no sistema.

