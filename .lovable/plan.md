

# Plano: Modo Real com Deterioração Automática por Inatividade

## Resumo
Adicionar um toggle "Modo Real" na tela de configuração do plantão. Quando ativado, o paciente piora automaticamente se o aluno demorar para agir (90s de inatividade). No modo treino (padrão), o paciente aguarda indefinidamente.

## Mudanças

### 1. Toggle "Modo Real" no Lobby (`ClinicalSimulation.tsx`)
- Novo state `realisticMode` (boolean, default `false`)
- Switch com label "🔴 Modo Real" + descrição curta: "Paciente piora se você demorar"
- Posicionar abaixo do seletor de dificuldade

### 2. Sistema de Deterioração Automática (`ClinicalSimulation.tsx`)
- `lastActionTime` ref — atualizado a cada mensagem enviada
- `deteriorationCount` state (0 a 3)
- `setInterval` a cada 10s checando inatividade (só quando `realisticMode === true` e `phase === "active"`)
- **60s sem ação**: badge amarelo pulsante "⚠️ Paciente aguardando conduta..."
- **90s sem ação**: dispara chamada automática à edge function com `action: "deteriorate"`
  - Vitais pioram progressivamente
  - Score penalizado (-2 a -3)
  - Timeline recebe entrada "⚠️ Paciente piorou (inatividade)"
  - Som `worsened` + animação de alerta
- **3 deteriorações**: caso encerra automaticamente como "paciente em parada cardíaca"

### 3. Handler de Deterioração na Edge Function (`clinical-simulation/index.ts`)
- Reconhecer `action: "deteriorate"` com campo `deterioration_level` (1, 2 ou 3)
- Prompt específico: "O aluno não agiu. Piore vitais proporcionalmente ao nível. Nível 3 = parada/choque refratário"
- Retornar vitais atualizados, `patient_status` ajustado, score com penalidade

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ClinicalSimulation.tsx` | State `realisticMode`, Switch no lobby, lógica de inatividade com interval, aviso visual, auto-deterioração, auto-encerramento após 3 pioras |
| `supabase/functions/clinical-simulation/index.ts` | Handler para `action: "deteriorate"` com piora progressiva em 3 níveis |

## Detalhes Técnicos
- Switch do shadcn para o toggle
- `useRef` para `lastActionTime` (evita re-renders)
- Interval com cleanup no unmount e ao encerrar caso
- Nenhuma mudança no banco de dados

