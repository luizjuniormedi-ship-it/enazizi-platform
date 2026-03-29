import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./MonitoringMetricCard";
import { DashboardData } from "./MonitoringTypes";
import { Target, BookOpen, XCircle, CheckCircle2 } from "lucide-react";

export function PerformanceTab({ d }: { d: DashboardData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Target} label="Score médio aprovação" value={`${d.learning.avgApprovalScore}%`} />
        <MetricCard icon={BookOpen} label="Questões no banco" value={d.learning.totalQuestionsBank} />
        <MetricCard icon={XCircle} label="Erros recentes (7d)" value={d.learning.recentErrors} color="text-destructive" />
        <MetricCard icon={CheckCircle2} label="Taxa execução" value={`${d.studyEngine.executionRate}%`} color="text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">📈 Temas Mais Estudados</CardTitle>
          </CardHeader>
          <CardContent>
            {d.learning.topTopics.length > 0 ? (
              <div className="space-y-2">
                {d.learning.topTopics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs truncate flex-1">{t.topic}</span>
                    <Badge variant="secondary" className="text-[10px] ml-2">{t.count} questões</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">🔴 Temas Mais Fracos</CardTitle>
          </CardHeader>
          <CardContent>
            {d.learning.weakTopics.length > 0 ? (
              <div className="space-y-2">
                {d.learning.weakTopics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs truncate flex-1">{t.topic}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-[10px] text-destructive font-semibold">{t.accuracy}%</span>
                      <Badge variant="outline" className="text-[10px]">{t.questions}q</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
