import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Clock, TrendingUp } from "lucide-react";
import ProgressDelta from "@/components/study/ProgressDelta";
import type { StudyRecommendation } from "@/hooks/useStudyEngine";

interface Props {
  tasks: StudyRecommendation[];
  completedIds: string[];
  progress: number;
  completedMinutes: number;
  totalMinutes: number;
}

function getMotivationalMessage(pct: number): string {
  if (pct >= 100) return "Missão concluída! Excelente trabalho! 🎉";
  if (pct >= 75) return "Quase lá! Falta pouco para completar a missão.";
  if (pct >= 50) return "Metade concluída! Seu foco está valendo a pena.";
  if (pct >= 25) return "Bom começo! Continue firme.";
  return "Vamos começar! Cada tarefa conta.";
}

export default function MissionProgressFeedback({ tasks, completedIds, progress, completedMinutes, totalMinutes }: Props) {
  const byType: Record<string, { done: number; total: number }> = {};
  for (const t of tasks) {
    if (!byType[t.type]) byType[t.type] = { done: 0, total: 0 };
    byType[t.type].total++;
    if (completedIds.includes(t.id)) byType[t.type].done++;
  }

  const TYPE_NAMES: Record<string, string> = {
    review: "Revisões", error_review: "Correções", practice: "Questões",
    clinical: "Clínicos", new: "Novos", simulado: "Simulados",
  };

  const remaining = tasks.length - completedIds.length;

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-primary" />
          Progresso da Missão
        </h3>

        <div>
          <Progress value={progress} className="h-2.5 transition-all duration-500" />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{progress}% concluído</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {completedMinutes}/{totalMinutes}min
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(byType).map(([type, { done, total }]) => (
            <div key={type} className="rounded-lg bg-secondary/50 px-2.5 py-1.5 text-[10px]">
              <span className="font-medium">{TYPE_NAMES[type] || type}:</span>{" "}
              <span className={done === total ? "text-emerald-500 font-bold" : ""}>
                {done}/{total}
              </span>
            </div>
          ))}
        </div>

        {remaining > 0 && completedIds.length > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-primary" />
            Faltam {remaining} tarefa{remaining > 1 ? "s" : ""} para concluir hoje
          </p>
        )}

        <p className="text-xs text-muted-foreground italic">
          {getMotivationalMessage(progress)}
        </p>
      </CardContent>
    </Card>
  );
}
