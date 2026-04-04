import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sunrise } from "lucide-react";
import type { StudyRecommendation, AdaptiveState } from "@/hooks/useStudyEngine";

interface Props {
  nextTask: StudyRecommendation | null;
  adaptive?: AdaptiveState;
  isAlmostDone: boolean;
}

function getTomorrowHint(adaptive?: AdaptiveState): string {
  if (!adaptive) return "Continue amanhã para manter o ritmo.";
  const phase = adaptive.mode?.phase;
  if (adaptive.heavyRecovery?.active && adaptive.heavyRecovery.phase < 4) {
    return "Amanhã continuaremos a recuperação com carga controlada.";
  }
  if (adaptive.recoveryMode) return "Amanhã o foco será reduzir mais o backlog.";
  if (phase === "critico") return "Amanhã vamos fortalecer mais a base.";
  if (phase === "atencao") return "Amanhã teremos mais revisões e conteúdo novo.";
  if (phase === "competitivo") return "Amanhã o foco será simulados e prática.";
  return "Amanhã manteremos a consistência com revisões leves.";
}

export default function MissionContinuity({ nextTask, adaptive, isAlmostDone }: Props) {
  return (
    <Card className="rounded-xl border-border/50 bg-card/50">
      <CardContent className="p-4 space-y-2">
        {nextTask && !isAlmostDone && (
          <div className="flex items-center gap-2.5">
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Próxima tarefa</p>
              <p className="text-sm font-medium truncate">{nextTask.topic}</p>
            </div>
          </div>
        )}
        {isAlmostDone && (
          <div className="flex items-center gap-2.5">
            <Sunrise className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              {getTomorrowHint(adaptive)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
