import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Target, BarChart3, Gauge } from "lucide-react";
import type { ExamReadiness } from "@/lib/examReadiness";
import type { PreparationIndexData, PreparationZone } from "@/hooks/usePreparationIndex";
import type { AdaptiveState } from "@/hooks/useStudyEngine";

interface Props {
  examReadiness?: ExamReadiness[];
  prepIndex?: PreparationIndexData;
  adaptive?: AdaptiveState;
}

const ZONE_LABELS: Record<PreparationZone, { label: string; color: string }> = {
  base_fraca: { label: "Crítico", color: "bg-destructive/10 text-destructive border-destructive/30" },
  em_construcao: { label: "Atenção", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  competitivo: { label: "Competitivo", color: "bg-primary/10 text-primary border-primary/30" },
  forte: { label: "Pronto", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
};

function getTrendPhrase(zone: PreparationZone, delta: number): string {
  if (delta >= 5) return "Você está evoluindo bem esta semana!";
  if (delta >= 1) return "Seu ritmo está consistente. Continue assim.";
  if (delta <= -3) return "Seu atraso está impactando sua preparação.";
  if (delta < 0) return "Pequena queda. Foque nas revisões hoje.";
  if (zone === "base_fraca") return "Construa sua base com foco diário.";
  if (zone === "forte") return "Excelente! Mantenha a consistência.";
  return "Estável. Hoje é dia de avançar.";
}

export default function MissionSituationCard({ examReadiness, prepIndex, adaptive }: Props) {
  const topExam = examReadiness?.[0];
  const zone = prepIndex?.zone || "em_construcao";
  const delta = prepIndex?.weeklyDelta || 0;
  const zoneInfo = ZONE_LABELS[zone];

  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? "text-emerald-500" : delta < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <Card className="rounded-xl border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Target className="h-4 w-4 text-primary" />
            Sua Situação Atual
          </h3>
          <Badge className={`text-[10px] ${zoneInfo.color}`} variant="outline">
            {zoneInfo.label}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Chance por banca */}
          <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
            <BarChart3 className="h-4 w-4 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold">
              {topExam ? `${Math.round(topExam.overallChance)}%` : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {topExam?.examName || "Chance"}
            </div>
          </div>

          {/* PrepIndex */}
          <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
            <Gauge className="h-4 w-4 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold">
              {prepIndex ? prepIndex.score : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground">PrepIndex</div>
          </div>

          {/* Tendência */}
          <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
            <TrendIcon className={`h-4 w-4 mx-auto mb-1 ${trendColor}`} />
            <div className={`text-lg font-bold ${trendColor}`}>
              {delta > 0 ? `+${delta}` : delta}
            </div>
            <div className="text-[10px] text-muted-foreground">Semana</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          {getTrendPhrase(zone, delta)}
        </p>
      </CardContent>
    </Card>
  );
}
