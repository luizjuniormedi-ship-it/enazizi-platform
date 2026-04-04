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
  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 space-y-2.5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <ListChecks className="h-4 w-4 text-primary" />
          Missão do Dia
        </h3>
        <div className="space-y-1.5">
          {tasks.map((task, idx) => {
            const done = completedIds.includes(task.id);
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={task.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isCurrent ? "bg-primary/10 border border-primary/30" :
                  done ? "bg-muted/50 text-muted-foreground" : "bg-secondary/30"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <Target className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                )}
                <span className="text-base shrink-0">{TYPE_ICONS[task.type] || "📋"}</span>
                <div className="min-w-0 flex-1">
                  <span className={`block truncate font-medium ${done ? "line-through" : ""}`}>
                    {task.topic}
                  </span>
                </div>
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
      </CardContent>
    </Card>
  );
}
