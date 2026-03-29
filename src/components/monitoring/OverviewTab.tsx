import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./MonitoringMetricCard";
import { DashboardData } from "./MonitoringTypes";
import {
  Users, Zap, Clock, AlertTriangle, Target, CheckCircle2,
  XCircle, BarChart3, BookOpen,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export function OverviewTab({ d }: { d: DashboardData }) {
  const studentsAtRisk = d.riskAlerts?.filter(r => r.severity === "high").length || 0;

  return (
    <div className="space-y-4">
      {/* System status */}
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${d.system.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
        <span className="text-sm font-semibold">
          Sistema {d.system.status === "online" ? "Online" : "Offline"}
        </span>
        <Badge variant="outline" className="text-[10px]">Uptime: {d.system.uptime}</Badge>
        {studentsAtRisk > 0 && (
          <Badge variant="destructive" className="text-[10px] ml-auto">
            {studentsAtRisk} aluno(s) em risco
          </Badge>
        )}
      </div>

      {/* Top KPIs for mentors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="Alunos online" value={d.users.activeNow} color="text-emerald-500" />
        <MetricCard icon={Target} label="Score médio aprovação" value={`${d.learning.avgApprovalScore}%`} color="text-primary" />
        <MetricCard icon={BarChart3} label="Taxa execução" value={`${d.studyEngine.executionRate}%`} />
        <MetricCard icon={AlertTriangle} label="Alunos em risco" value={studentsAtRisk} color={studentsAtRisk > 0 ? "text-destructive" : "text-emerald-500"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Target} label="Planos hoje" value={d.studyEngine.dailyPlansToday} />
        <MetricCard icon={CheckCircle2} label="Tarefas concluídas" value={d.studyEngine.tasksCompleted} color="text-emerald-500" />
        <MetricCard icon={XCircle} label="Tarefas atrasadas" value={d.studyEngine.overdueTasks} color={d.studyEngine.overdueTasks > 10 ? "text-destructive" : "text-yellow-500"} />
        <MetricCard icon={Zap} label="Chamadas IA (24h)" value={d.ai.totalCalls24h} color="text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Score Médio de Aprovação</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <div className="text-4xl font-black text-primary tabular-nums">{d.learning.avgApprovalScore}%</div>
            <Progress value={d.learning.avgApprovalScore} className="h-3 w-full" />
            <p className="text-xs text-muted-foreground">{d.learning.totalQuestionsBank} questões no banco</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">🔴 Temas Mais Fracos</CardTitle>
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
