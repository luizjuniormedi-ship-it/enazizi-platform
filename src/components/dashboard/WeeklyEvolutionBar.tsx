import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function WeeklyEvolutionBar() {
  const { data } = useDashboardData();

  if (!data) return null;

  const { stats, metrics } = data;
  const weeklyChart = stats.weeklyChart || [];

  // Calculate weekly evolution
  const thisWeekHours = weeklyChart.length > 0 ? weeklyChart[weeklyChart.length - 1]?.hours || 0 : 0;
  const lastWeekHours = weeklyChart.length > 1 ? weeklyChart[weeklyChart.length - 2]?.hours || 0 : 0;

  const evolution = lastWeekHours > 0
    ? Math.round(((thisWeekHours - lastWeekHours) / lastWeekHours) * 100)
    : thisWeekHours > 0 ? 100 : 0;

  // Simple weekly progress: tasks completed / total
  const taskPercent = stats.totalTasks > 0
    ? Math.min(Math.round((stats.completedTasks / stats.totalTasks) * 100), 100)
    : 0;

  const TrendIcon = evolution > 0 ? TrendingUp : evolution < 0 ? TrendingDown : Minus;
  const trendColor = evolution > 0 ? "text-emerald-500" : evolution < 0 ? "text-destructive" : "text-muted-foreground";
  const trendText = evolution > 0 ? `+${evolution}%` : evolution < 0 ? `${evolution}%` : "estável";

  return (
    <Card className="border-border/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-semibold">Progresso semanal</span>
          <span className={`text-xs font-medium flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trendText} vs semana anterior
          </span>
        </div>
        <Progress value={taskPercent} className="h-2.5" />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {stats.completedTasks}/{stats.totalTasks} tarefas
          </span>
          <span className="text-xs font-medium text-foreground">{taskPercent}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
