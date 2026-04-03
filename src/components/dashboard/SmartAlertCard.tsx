import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

/**
 * Shows at most 1 smart alert based on priority:
 * 1. Overdue reviews
 * 2. Critical weak topic
 * 3. Exam approaching
 */
export default function SmartAlertCard() {
  const navigate = useNavigate();
  const { data } = useDashboardData();

  if (!data) return null;
  const { metrics, stats } = data;

  // Priority 1: Pending reviews
  if (metrics.pendingRevisoes >= 3) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 shrink-0">
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Você tem {metrics.pendingRevisoes} revisões atrasadas
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs gap-1 h-8"
            onClick={() => navigate("/dashboard/missao")}
          >
            Resolver <ArrowRight className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Priority 2: Exam approaching with low progress
  if (stats.daysUntilExam !== null && stats.daysUntilExam <= 30) {
    const taskPercent = stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;
    if (taskPercent < 50) {
      return (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {stats.daysUntilExam} dias para a prova — intensifique o estudo
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 text-xs gap-1 h-8"
              onClick={() => navigate("/dashboard/missao")}
            >
              Estudar <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      );
    }
  }

  // Priority 3: High error count
  if (metrics.errorsCount >= 5) {
    return (
      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10 shrink-0">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Tema crítico identificado — {metrics.errorsCount} erros acumulados
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs gap-1 h-8"
            onClick={() => navigate("/dashboard/banco-erros")}
          >
            Resolver <ArrowRight className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
