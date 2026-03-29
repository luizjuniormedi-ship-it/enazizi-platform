import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./MonitoringMetricCard";
import { DashboardData, StudentRow } from "./MonitoringTypes";
import { Target, BookOpen, XCircle, CheckCircle2, TrendingUp, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function PerformanceTab({ d, students }: { d: DashboardData; students?: StudentRow[] }) {
  // Build topic performance bar chart from weak topics
  const weakTopicChart = d.learning.weakTopics.slice(0, 8).map(t => ({
    name: t.topic.length > 18 ? t.topic.substring(0, 18) + "…" : t.topic,
    accuracy: t.accuracy,
    questions: t.questions,
  }));

  const topTopicChart = d.learning.topTopics.slice(0, 8).map(t => ({
    name: t.topic.length > 18 ? t.topic.substring(0, 18) + "…" : t.topic,
    count: t.count,
  }));

  // Score distribution from students
  const scoreDistribution = buildScoreDistribution(students);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Target} label="Score médio aprovação" value={`${d.learning.avgApprovalScore}%`} color="text-primary" />
        <MetricCard icon={BookOpen} label="Questões no banco" value={d.learning.totalQuestionsBank} />
        <MetricCard icon={XCircle} label="Erros recentes (7d)" value={d.learning.recentErrors} color="text-destructive" />
        <MetricCard icon={CheckCircle2} label="Taxa execução" value={`${d.studyEngine.executionRate}%`} color="text-emerald-500" />
      </div>

      {/* Score Distribution */}
      {scoreDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Distribuição de Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} width={25} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Alunos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Studied */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Temas Mais Estudados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTopicChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topTopicChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} name="Questões" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Weakest Topics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Temas Mais Fracos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weakTopicChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weakTopicChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="accuracy" fill="hsl(0 84% 60%)" radius={[0, 4, 4, 0]} name="Acerto %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function buildScoreDistribution(students?: StudentRow[]) {
  if (!students || students.length === 0) return [];
  const ranges = [
    { range: "0-20", min: 0, max: 20 },
    { range: "21-40", min: 21, max: 40 },
    { range: "41-60", min: 41, max: 60 },
    { range: "61-80", min: 61, max: 80 },
    { range: "81-100", min: 81, max: 100 },
  ];
  return ranges.map(r => ({
    range: r.range,
    count: students.filter(s => s.approval_score >= r.min && s.approval_score <= r.max).length,
  }));
}
