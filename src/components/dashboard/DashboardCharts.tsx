import { lazy, Suspense, useState } from "react";
import { TrendingUp, CalendarDays, BarChart3, CheckCircle2, BookOpen, Flame, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats, DashboardMetrics } from "@/hooks/useDashboardData";

// Lazy-load recharts (heavy)
const LazyBarChart = lazy(() =>
  import("recharts").then((m) => ({
    default: ({ data, weekFilter }: { data: any[]; weekFilter: number }) => {
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = m;
      const cutoff = Date.now() - weekFilter * 7 * 24 * 60 * 60 * 1000;
      const filtered = data.filter((d) => d.timestamp >= cutoff);
      if (filtered.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado neste período.</p>;
      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={filtered} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" unit="h" />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [`${value}h`, "Horas"]}
              labelFormatter={(label) => `Semana de ${label}`}
            />
            <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    },
  }))
);

const ChartSkeleton = () => <Skeleton className="w-full h-[250px] rounded-lg" />;

interface Props {
  stats: DashboardStats;
  metrics: DashboardMetrics;
}

const DashboardCharts = ({ stats, metrics }: Props) => {
  const [weekFilter, setWeekFilter] = useState<4 | 8 | 12>(8);
  const taskPercent = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const sortedSubjects = Object.entries(stats.subjectHours).sort((a, b) => b[1] - a[1]);
  const maxHours = sortedSubjects.length > 0 ? sortedSubjects[0][1] : 1;

  const formatReviewDate = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "Hoje";
    if (diff === 1) return "Amanhã";
    return `${diff} dias`;
  };

  return (
    <>
      {/* Daily Summary & Streak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CalendarCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Progresso de hoje</div>
            <div className="text-2xl font-bold">{stats.todayTotal > 0 ? Math.round((stats.todayCompleted / stats.todayTotal) * 100) : 0}%</div>
            <div className="text-xs text-muted-foreground">{stats.todayCompleted} de {stats.todayTotal} blocos concluídos</div>
          </div>
          {stats.todayTotal > 0 && (
            <div className="w-16 h-16 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-secondary" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-primary" strokeWidth="3"
                  strokeDasharray={`${(stats.todayCompleted / stats.todayTotal) * 100} ${100 - (stats.todayCompleted / stats.todayTotal) * 100}`}
                  strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${stats.streak > 0 ? "bg-orange-500/10" : "bg-muted"}`}>
            <Flame className={`h-6 w-6 ${stats.streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Streak de estudos</div>
            <div className="text-2xl font-bold">{stats.streak} {stats.streak === 1 ? "dia" : "dias"}</div>
            <div className="text-xs text-muted-foreground">
              {stats.streak === 0 ? "Complete uma tarefa para começar!" : stats.streak >= 7 ? "🔥 Sequência incrível!" : "Continue assim!"}
            </div>
          </div>
        </div>
      </div>

      {/* Task Progress */}
      {stats.totalTasks > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Progresso geral das tarefas
            </span>
            <span className="text-sm font-bold text-primary">{taskPercent}%</span>
          </div>
          <Progress value={taskPercent} className="h-3" />
        </div>
      )}

      {/* Weekly Chart (lazy loaded) */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução semanal
          </h2>
          <div className="flex gap-1">
            {([4, 8, 12] as const).map((w) => (
              <Button key={w} variant={weekFilter === w ? "default" : "outline"} size="sm" className="h-7 text-xs px-3" onClick={() => setWeekFilter(w)}>
                {w} sem
              </Button>
            ))}
          </div>
        </div>
        <Suspense fallback={<ChartSkeleton />}>
          <LazyBarChart data={stats.weeklyChart} weekFilter={weekFilter} />
        </Suspense>
      </div>

      {/* Reviews & Subject Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Próximas revisões
            {metrics.pendingRevisoes > 0 && (
              <span className="ml-auto text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full font-medium">
                {metrics.pendingRevisoes} pendente{metrics.pendingRevisoes !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          {stats.upcomingReviews.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingReviews.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">{r.topic}</span>
                  <span className="text-xs text-muted-foreground">{formatReviewDate(r.next)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma revisão agendada.</p>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Horas por matéria (semanal)
          </h2>
          {sortedSubjects.length > 0 ? (
            <div className="space-y-4">
              {sortedSubjects.slice(0, 6).map(([subject, hours]) => (
                <div key={subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate mr-2">{subject}</span>
                    <span className="text-muted-foreground flex-shrink-0">{hours}h</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(hours / maxHours) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Gere um cronograma para ver a distribuição.</p>
          )}
        </div>
      </div>

      {/* Subjects */}
      {stats.subjects.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Matérias do plano
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.subjects.map((s) => (
              <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardCharts;
