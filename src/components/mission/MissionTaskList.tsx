import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Target, Clock, ListChecks } from "lucide-react";
import type { StudyRecommendation } from "@/hooks/useStudyEngine";

interface Props {
  tasks: StudyRecommendation[];
  currentIndex: number;
  completedIds: string[];
}

const TYPE_LABELS: Record<string, string> = {
  review: "Revisão", error_review: "Correção", practice: "Questões",
  clinical: "Clínico", new: "Novo", simulado: "Simulado",
};

const TYPE_ICONS: Record<string, string> = {
  review: "🔄", error_review: "🔴", practice: "📝",
  clinical: "🏥", new: "📚", simulado: "🎯",
};

export default function MissionTaskList({ tasks, currentIndex, completedIds }: Props) {
  const remaining = tasks.filter(t => !completedIds.includes(t.id));
  const completedCount = completedIds.length;

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <ListChecks className="h-4 w-4 text-primary" />
            Missão do Dia
          </h3>
          {completedCount > 0 && (
            <span className="text-[10px] text-emerald-500 font-medium">
              {completedCount} concluída{completedCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {tasks.map((task, idx) => {
            const done = completedIds.includes(task.id);
            const isCurrent = idx === currentIndex && !done;
            return (
              <div
                key={task.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-300 ${
                  done
                    ? "bg-muted/30 text-muted-foreground/60 opacity-60 scale-[0.98]"
                    : isCurrent
                    ? "bg-primary/10 border border-primary/30 shadow-sm"
                    : "bg-secondary/30"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <Target className="h-4 w-4 text-primary shrink-0 animate-pulse" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                )}
                <span className="text-base shrink-0">{TYPE_ICONS[task.type] || "📋"}</span>
                <div className="min-w-0 flex-1">
                  <span className={`block truncate font-medium ${done ? "line-through" : ""}`}>
                    {task.topic}
                  </span>
                </div>
                {(task as any).pendingCount > 1 && !done && (
                  <Badge variant="outline" className="text-[9px] shrink-0 border-destructive/40 text-destructive">
                    {(task as any).pendingCount}x
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {TYPE_LABELS[task.type] || task.type}
                </Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                  <Clock className="h-3 w-3" />
                  {task.estimatedMinutes}m
                </span>
              </div>
            );
          })}
        </div>

        {remaining.length > 0 && remaining.length < tasks.length && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            Faltam {remaining.length} tarefa{remaining.length > 1 ? "s" : ""} para concluir hoje
          </p>
        )}
      </CardContent>
    </Card>
  );
}
