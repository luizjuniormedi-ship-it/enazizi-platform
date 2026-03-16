

## Plano: Melhorias no Modo Plantão

### Resumo
Adicionar 3 novos botões na barra de ações rápidas e expandir o relatório final com avaliação de conduta, prescrição e mais categorias. Manter o botão "Encerrar Plantão" no header como está.

### Mudanças

**1. Novos botões na barra de ações rápidas (`src/pages/ClinicalSimulation.tsx`)**
- **Ajuda do Preceptor** — Envia prompt pedindo dicas pedagógicas sem revelar diagnóstico
- **Parecer de Especialista** — Envia prompt solicitando interconsulta de especialista
- **Encerrar Plantão** — Botão destructive na barra de ações que chama `finishSimulation()` (duplica o do header para ficar mais acessível)
- Novos ícones: `HelpCircle`, `Users`, `ClipboardCheck`

**2. Atualizar edge function (`supabase/functions/clinical-simulation/index.ts`)**
- Adicionar actions `hint` e `specialist` no handler
- Expandir o `SYSTEM_PROMPT` para:
  - `action="hint"`: IA age como preceptor, dá dicas de raciocínio clínico sem entregar diagnóstico
  - `action="specialist"`: IA age como médico especialista dando parecer técnico
  - `action="finish"`: Avaliação expandida com subcategorias de **prescrição** (medicamento, dose, via, posologia), **conduta** (internação/alta/encaminhamento), **pedido de parecer** e **diagnóstico**

**3. Expandir relatório final na UI**
- Adicionar novas categorias na seção de avaliação: `prescription`, `diagnosis`, `referral`
- Labels: "Prescrição", "Diagnóstico", "Parecer/Encaminhamento"
- Manter as existentes: Anamnese, Exame Físico, Exames Complementares, Conduta
- Tornar o mapeamento de labels dinâmico para suportar categorias extras que a IA retorne

### Arquivos alterados
- `src/pages/ClinicalSimulation.tsx` — UI: novos botões + relatório expandido
- `supabase/functions/clinical-simulation/index.ts` — Backend: novas actions + prompt expandido

