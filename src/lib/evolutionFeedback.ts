import { toast } from "sonner";

export type EvolutionEvent =
  | "error_corrected"
  | "topic_improved"
  | "specialty_level_up"
  | "consistency_streak"
  | "reinforcement_success"
  | "mastery_reached";

const FEEDBACK_MESSAGES: Record<EvolutionEvent, string[]> = {
  error_corrected: [
    "Erro corrigido com sucesso! Seu aprendizado está avançando.",
    "Você dominou um erro anterior. Parabéns!",
    "Falha transformada em conhecimento. Continue assim!",
  ],
  topic_improved: [
    "Você melhorou neste tema. Sua evolução é real!",
    "Seu desempenho está mais consistente neste assunto.",
    "Evolução comprovada! Este tema já está mais sólido.",
  ],
  specialty_level_up: [
    "Nível de especialidade aumentou! Seu domínio está crescendo.",
    "Você está dominando esse conteúdo. Impressionante!",
  ],
  consistency_streak: [
    "Sua consistência está fazendo a diferença!",
    "Estudar todo dia gera resultados. Continue firme!",
  ],
  reinforcement_success: [
    "Reforço concluído! O conteúdo está fixando melhor agora.",
    "Revisão eficaz! Menos chance de esquecer.",
  ],
  mastery_reached: [
    "Conteúdo dominado! Você pode focar em outros pontos agora.",
    "Domínio comprovado! Uma conquista de verdade.",
  ],
};

const ICONS: Record<EvolutionEvent, string> = {
  error_corrected: "🔧",
  topic_improved: "📈",
  specialty_level_up: "⬆️",
  consistency_streak: "🔥",
  reinforcement_success: "✅",
  mastery_reached: "🏆",
};

// Cooldown to avoid spam — max 1 toast per event type per 30s
const lastShown = new Map<string, number>();
const COOLDOWN_MS = 30_000;

export function showEvolutionFeedback(event: EvolutionEvent, detail?: string): void {
  const now = Date.now();
  const last = lastShown.get(event) || 0;
  if (now - last < COOLDOWN_MS) return;
  lastShown.set(event, now);

  const messages = FEEDBACK_MESSAGES[event];
  const message = messages[Math.floor(Math.random() * messages.length)];
  const icon = ICONS[event];

  toast(`${icon} ${message}`, {
    description: detail || undefined,
    duration: 3500,
  });
}
