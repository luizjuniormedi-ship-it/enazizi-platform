import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./MonitoringMetricCard";
import { DashboardData, MentorSummary, RiskAlert } from "./MonitoringTypes";
import {
  Users, Zap, Clock, AlertTriangle, Target, CheckCircle2,
  XCircle, BarChart3, ShieldAlert, TrendingDown,
} from "lucide-react";

export function OverviewTab({ d, mentorSummary }: { d: DashboardData; mentorSummary?: MentorSummary }) {
  const ms = mentorSummary;
  const studentsAtRisk = ms ? ms.risk + ms.critical : (d.riskAlerts?.filter(r => r.severity === "high").length || 0);

  return (
    <div className="space-y-4">
      {/* System status */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className={`h-3 w-3 rounded-full ${d.system.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
        <span className="text-sm font-semibold">
          Sistema {d.system.status === "online" ? "Online" : "Offline"}
        </span>
        <Badge variant="outline" className="text-[10px]">Uptime: {d.system.uptime}</Badge>
      </div>

      {/* Mentor KPIs */}
      {ms && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={Users} label="Total alunos" value={ms.total} color="text-primary" />
          <MetricCard icon={CheckCircle2} label="Ativos" value={ms.active} color="text-emerald-500" />
          <MetricCard icon={AlertTriangle} label="Atenção" value={ms.attention} color="text-yellow-500" />
          <MetricCard icon={ShieldAlert} label="Risco + Crítico" value={ms.risk + ms.critical} color={ms.risk + ms.critical > 0 ? "text-destructive" : "text-emerald-500"} />
        </div>
      )}

      {/* Score averages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Target} label="Score aprovação médio" value={`${ms?.avg_approval || d.learning.avgApprovalScore}%`} color="text-primary" />
        <MetricCard icon={TrendingDown} label="Risco médio" value={ms?.avg_risk ?? "—"} color={(ms?.avg_risk ?? 0) > 40 ? "text-destructive" : "text-emerald-500"} />
        <MetricCard icon={BarChart3} label="Engajamento médio" value={ms?.avg_engagement ?? "—"} color={(ms?.avg_engagement ?? 0) >= 50 ? "text-emerald-500" : "text-yellow-500"} />
        <MetricCard icon={Zap} label="Chamadas IA (24h)" value={d.ai.totalCalls24h} />
      </div>

      {/* Study Engine */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Target} label="Planos hoje" value={d.studyEngine.dailyPlansToday} />
        <MetricCard icon={CheckCircle2} label="Tarefas concluídas" value={d.studyEngine.tasksCompleted} color="text-emerald-500" />
        <MetricCard icon={XCircle} label="Tarefas atrasadas" value={d.studyEngine.overdueTasks} color={d.studyEngine.overdueTasks > 10 ? "text-destructive" : "text-yellow-500"} />
        <MetricCard icon={BarChart3} label="Taxa execução" value={`${d.studyEngine.executionRate}%`} />
      </div>

      {/* Approval + Weak Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Score Médio de Aprovação</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <div className="text-4xl font-black text-primary tabular-nums">{ms?.avg_approval || d.learning.avgApprovalScore}%</div>
            <Progress value={ms?.avg_approval || d.learning.avgApprovalScore} className="h-3 w-full" />
            <p className="text-xs text-muted-foreground">{d.learning.totalQuestionsBank} questões no banco</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">🔴 Temas Mais Fracos (Global)</CardTitle>
          </CardHeader>
          <CardContent>
            {d.learning.weakTopics.length > 0 ? (
              <div className="space-y-2">
                {d.learning.weakTopics.slice(0, 5).map((t, i) => (
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
