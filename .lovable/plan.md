

# Plano: Timeline de ações no AgentChat (estilo Modo Plantão)

## Objetivo
Adicionar uma faixa horizontal com badges mostrando as ações/perguntas enviadas pelo usuario, similar a timeline do Modo Plantao.

## Alteracoes

### `src/components/agents/AgentChat.tsx`

1. **Novo estado** `actionTimeline` — array de `{ label, timestamp }` acumulando cada mensagem enviada pelo usuario (truncada a ~30 chars)

2. **Registrar na timeline** — dentro de `handleSend`, ao enviar uma mensagem, adicionar entrada com o texto resumido e timestamp

3. **Renderizar timeline** — logo acima da area de mensagens (entre quick actions e chat), exibir badges horizontais com scroll, mostrando as ultimas 8 acoes com horario, identico ao pattern do ClinicalSimulation:
```text
[🩺 Tirar dúvida 14:32] [📌 Pontos de prova 14:35] [💊 Condutas 14:38]
```

4. Para quick actions, usar o icon/label da action. Para mensagens livres, usar icone 💬 + texto truncado.

### Resultado
- Timeline visivel durante toda a conversa mostrando historico de interacoes
- Mesmo visual (Badge outline com texto pequeno + horario) do Modo Plantao

