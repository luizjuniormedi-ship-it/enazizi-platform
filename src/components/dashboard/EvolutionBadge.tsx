import { EVOLUTION_CONFIG, type EvolutionStatus } from "@/hooks/useTopicEvolution";

interface Props {
  status: EvolutionStatus;
}

/**
 * Tiny inline indicator showing topic evolution status.
 * Used in TodayStudyCard, PlannerDayView, etc.
 */
export default function EvolutionBadge({ status }: Props) {
  const cfg = EVOLUTION_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${cfg.color}`}>
      <span>{cfg.emoji}</span>
      <span>{cfg.shortLabel}</span>
    </span>
  );
}
