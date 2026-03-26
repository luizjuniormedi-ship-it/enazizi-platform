import { Shield, Star, Award, Crown, Gem } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type MasteryLevel = "iniciante" | "basico" | "intermediario" | "avancado" | "dominado";

interface Props {
  level: MasteryLevel;
  percentage: number;
  compact?: boolean;
}

const config: Record<MasteryLevel, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  iniciante: { label: "Iniciante", icon: Shield, color: "text-muted-foreground", bg: "bg-muted/50" },
  basico: { label: "Básico", icon: Star, color: "text-blue-500", bg: "bg-blue-500/10" },
  intermediario: { label: "Intermediário", icon: Award, color: "text-amber-500", bg: "bg-amber-500/10" },
  avancado: { label: "Avançado", icon: Crown, color: "text-purple-500", bg: "bg-purple-500/10" },
  dominado: { label: "Dominado", icon: Gem, color: "text-green-500", bg: "bg-green-500/10" },
};

export function getMasteryLevel(correctRate: number, reviewsDone: number): { level: MasteryLevel; percentage: number } {
  const score = correctRate * 0.7 + Math.min(reviewsDone / 5, 1) * 0.3;
  if (score >= 0.9) return { level: "dominado", percentage: Math.round(score * 100) };
  if (score >= 0.7) return { level: "avancado", percentage: Math.round(score * 100) };
  if (score >= 0.5) return { level: "intermediario", percentage: Math.round(score * 100) };
  if (score >= 0.25) return { level: "basico", percentage: Math.round(score * 100) };
  return { level: "iniciante", percentage: Math.round(score * 100) };
}

const MasteryBadge = ({ level, percentage, compact }: Props) => {
  const c = config[level];
  const Icon = c.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${c.bg} ${c.color} font-medium`}>
              <Icon className="h-3 w-3" />
              {percentage}%
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{c.label} — {percentage}% de domínio</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${c.color}`}>
      <Icon className="h-3.5 w-3.5" />
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="font-medium">{c.label}</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-1 rounded-full bg-secondary w-20">
          <div className={`h-full rounded-full ${c.bg.replace("/10", "")} transition-all`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </div>
  );
};

export default MasteryBadge;
