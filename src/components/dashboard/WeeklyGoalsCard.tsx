import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeeklyGoals, WeeklyGoal } from "@/hooks/useWeeklyGoals";
import { Target } from "lucide-react";

function goalColor(percent: number): string {
  if (percent >= 100) return "bg-emerald-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-destructive";
}

function GoalRow({ goal }: { goal: WeeklyGoal }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-5 text-center">{goal.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="text-xs text-muted-foreground truncate">{goal.label}</span>
          <span className="text-xs font-medium tabular-nums">
            {goal.current}/{goal.target}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${goalColor(goal.percent)}`}
            style={{ width: `${Math.min(goal.percent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function WeeklyGoalsCard() {
  const { data, isLoading } = useWeeklyGoals();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { goals, overallPercent, message, weekLabel } = data;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Meta da semana</span>
          </div>
          <span className="text-xs text-muted-foreground">{weekLabel}</span>
        </div>

        {/* Overall progress */}
        <div className="flex items-center gap-2">
          <Progress value={overallPercent} className="flex-1 h-2" />
          <span className="text-xs font-bold tabular-nums w-10 text-right">{overallPercent}%</span>
        </div>

        {/* Goal rows */}
        <div className="space-y-2">
          {goals.map((g) => (
            <GoalRow key={g.key} goal={g} />
          ))}
        </div>

        {/* Motivational message */}
        <p className="text-xs text-muted-foreground text-center pt-1">{message}</p>
      </CardContent>
    </Card>
  );
}
