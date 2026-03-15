import { CalendarDays, FlipVertical, FileText, Upload, TrendingUp, Clock, BookOpen, CheckCircle2, Loader2, BarChart3, Flame, CalendarCheck, Globe, HelpCircle } from "lucide-react";
import XpWidget from "@/components/gamification/XpWidget";
import AchievementToast from "@/components/gamification/AchievementToast";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import DashboardWarnings from "@/components/dashboard/DashboardWarnings";
import TopicEvolution from "@/components/dashboard/TopicEvolution";
import MotivationalGreeting from "@/components/dashboard/MotivationalGreeting";
import WhatsNewPopup from "@/components/dashboard/WhatsNewPopup";
import SystemGuidePopup from "@/components/dashboard/SystemGuidePopup";
import SpecialtyBenchmark from "@/components/dashboard/SpecialtyBenchmark";

interface PlanJson {
  weeklySchedule?: { day: string; tasks: { time: string; subject: string; duration: string; type?: string }[] }[];
  subjects?: string[];
  tips?: string;
  config?: { examDate: string; hoursPerDay: number; daysPerWeek: number };
}

interface Stats {
  flashcards: number;
  uploads: number;
  completedTasks: number;
  totalTasks: number;
  totalStudyHours: number;
  subjects: string[];
  subjectHours: Record<string, number>;
  upcomingReviews: { topic: string; next: string }[];
  daysUntilExam: number | null;
  weeklyChart: { week: string; hours: number; timestamp: number }[];
  streak: number;
  todayCompleted: number;
  todayTotal: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekFilter, setWeekFilter] = useState<4 | 8 | 12>(8);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [globalFlashcards, setGlobalFlashcards] = useState(0);
  const [globalQuestions, setGlobalQuestions] = useState(0);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [flashcardsRes, uploadsRes, tasksRes, plansRes, reviewsRes, profileRes, perfRes, globalFlashRes, globalQuestRes] = await Promise.all([
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("uploads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("study_tasks").select("completed, created_at, task_json").eq("user_id", user.id),
        supabase.from("study_plans").select("plan_json").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("reviews").select("next_review, flashcard_id, flashcards(topic)").eq("user_id", user.id).gte("next_review", new Date().toISOString()).order("next_review", { ascending: true }).limit(5),
        supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("study_performance").select("questoes_respondidas, taxa_acerto").eq("user_id", user.id).maybeSingle(),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("is_global", true),
        supabase.from("questions_bank").select("id", { count: "exact", head: true }).eq("is_global", true),
      ]);

      setDisplayName(profileRes.data?.display_name || null);
      setQuestionsAnswered(perfRes.data?.questoes_respondidas || 0);
      setAccuracy(Number(perfRes.data?.taxa_acerto) || 0);
      setGlobalFlashcards(globalFlashRes.count || 0);
      setGlobalQuestions(globalQuestRes.count || 0);
      setAccuracy(Number(perfRes.data?.taxa_acerto) || 0);

      const tasks = tasksRes.data || [];
      const completedTasks = tasks.filter((t: any) => t.completed).length;

      // Build weekly chart from completed tasks
      const weekMap: Record<string, { hours: number; timestamp: number }> = {};
      for (const task of tasks) {
        if (!(task as any).completed) continue;
        const date = new Date((task as any).created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const key = `${String(weekStart.getDate()).padStart(2, "0")}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
        const taskJson = (task as any).task_json as any;
        const durationMatch = taskJson?.duration?.match?.(/(\d+(?:\.\d+)?)/);
        const hours = durationMatch ? parseFloat(durationMatch[1]) : 1;
        if (!weekMap[key]) weekMap[key] = { hours: 0, timestamp: weekStart.getTime() };
        weekMap[key].hours += hours;
      }
      const weeklyChart = Object.entries(weekMap)
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .map(([week, { hours, timestamp }]) => ({ week, hours: Math.round(hours * 10) / 10, timestamp }));

      const plan = plansRes.data?.plan_json as PlanJson | null;
      const subjects = plan?.subjects || [];
      const subjectHours: Record<string, number> = {};
      let totalStudyHours = 0;

      if (plan?.weeklySchedule) {
        for (const day of plan.weeklySchedule) {
          for (const task of day.tasks) {
            const match = task.duration.match(/(\d+(?:\.\d+)?)/);
            const hours = match ? parseFloat(match[1]) : 1;
            subjectHours[task.subject] = (subjectHours[task.subject] || 0) + hours;
            totalStudyHours += hours;
          }
        }
      }

      let daysUntilExam: number | null = null;
      if (plan?.config?.examDate) {
        const diff = new Date(plan.config.examDate).getTime() - Date.now();
        if (diff > 0) daysUntilExam = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      const upcomingReviews = (reviewsRes.data || []).map((r: any) => ({
        topic: r.flashcards?.topic || "Sem tópico",
        next: r.next_review,
      }));

      // Today's completion
      const DAY_MAP: Record<string, number> = { Dom: 0, Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, "Sáb": 6, Sab: 6 };
      const todayDow = new Date().getDay();
      const todaySchedule = plan?.weeklySchedule?.find((d) => DAY_MAP[d.day] === todayDow);
      const todayTotal = todaySchedule?.tasks.length || 0;
      const completedToday = tasks.filter((t: any) => {
        if (!t.completed) return false;
        const d = new Date(t.created_at);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      });
      const todayCompleted = completedToday.length;

      // Streak calculation
      const completedDates = new Set(
        tasks.filter((t: any) => t.completed).map((t: any) => {
          const d = new Date(t.created_at);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })
      );
      let streak = 0;
      const checkDate = new Date();
      // If no tasks today yet, start from yesterday
      const todayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (!completedDates.has(todayKey)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      while (true) {
        const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
        if (completedDates.has(key)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      setStats({
        flashcards: flashcardsRes.count || 0,
        uploads: uploadsRes.count || 0,
        completedTasks,
        totalTasks: tasks.length,
        totalStudyHours,
        subjects,
        subjectHours,
        upcomingReviews,
        daysUntilExam,
        weeklyChart,
        streak,
        todayCompleted,
        todayTotal,
      });
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const taskPercent = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  const sortedSubjects = Object.entries(stats.subjectHours).sort((a, b) => b[1] - a[1]);
  const maxHours = sortedSubjects.length > 0 ? sortedSubjects[0][1] : 1;

  const formatReviewDate = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "Hoje";
    if (diff === 1) return "Amanhã";
    return `${diff} dias`;
  };

  const statCards = [
    { label: "Flashcards", value: String(stats.flashcards), icon: FlipVertical, color: "text-primary", to: "/dashboard/flashcards" },
    { label: "Tarefas concluídas", value: `${stats.completedTasks}/${stats.totalTasks}`, icon: CheckCircle2, color: "text-accent", to: "/dashboard/cronograma" },
    { label: "Uploads", value: String(stats.uploads), icon: Upload, color: "text-green-500", to: "/dashboard/uploads" },
    { label: "Horas/semana", value: `${stats.totalStudyHours}h`, icon: Clock, color: "text-orange-500", to: "/dashboard/cronograma" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <WhatsNewPopup />
      <SystemGuidePopup />
      <div>
        <MotivationalGreeting
          streak={stats.streak}
          todayCompleted={stats.todayCompleted}
          todayTotal={stats.todayTotal}
          completedTasks={stats.completedTasks}
          totalTasks={stats.totalTasks}
          daysUntilExam={stats.daysUntilExam}
          questionsAnswered={questionsAnswered}
          accuracy={accuracy}
          displayName={displayName}
        />

        <div className="mt-4 mb-2">
          <XpWidget />
        </div>
        <AchievementToast />

        <h1 className="text-2xl font-bold mt-5">Dashboard</h1>
        <p className="text-muted-foreground">
          {stats.daysUntilExam
            ? `${stats.daysUntilExam} dias até a prova • ${taskPercent}% das tarefas concluídas`
            : "Bem-vindo de volta! Aqui está seu progresso."}
        </p>

        <DashboardWarnings
          todayCompleted={stats.todayCompleted}
          todayTotal={stats.todayTotal}
          completedTasks={stats.completedTasks}
          totalTasks={stats.totalTasks}
          streak={stats.streak}
          daysUntilExam={stats.daysUntilExam}
        />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} to={s.to} className="glass-card p-5 hover:border-primary/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <TrendingUp className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Global Knowledge Base Banner */}
      {(globalFlashcards > 0 || globalQuestions > 0) && (
        <div className="glass-card p-5 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Base de Conhecimento Global</h3>
              <p className="text-xs text-muted-foreground">Conteúdo colaborativo gerado por todos os usuários</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/dashboard/flashcards" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
              <FlipVertical className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <div className="text-lg font-bold">{globalFlashcards}</div>
                <div className="text-xs text-muted-foreground">Flashcards globais</div>
              </div>
            </Link>
            <Link to="/dashboard/banco-questoes" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
              <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <div className="text-lg font-bold">{globalQuestions}</div>
                <div className="text-xs text-muted-foreground">Questões globais</div>
              </div>
            </Link>
          </div>
        </div>
      )}

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
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeDasharray={`${(stats.todayCompleted / stats.todayTotal) * 100} ${100 - (stats.todayCompleted / stats.todayTotal) * 100}`}
                  strokeLinecap="round"
                />
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

      {/* Task Progress Bar */}
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

      {/* Weekly Evolution Chart */}
      {(() => {
        const cutoff = Date.now() - weekFilter * 7 * 24 * 60 * 60 * 1000;
        const filteredChart = stats.weeklyChart.filter((d) => d.timestamp >= cutoff);
        return (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolução semanal
              </h2>
              <div className="flex gap-1">
                {([4, 8, 12] as const).map((w) => (
                  <Button
                    key={w}
                    variant={weekFilter === w ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-3"
                    onClick={() => setWeekFilter(w)}
                  >
                    {w} sem
                  </Button>
                ))}
              </div>
            </div>
            {filteredChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={filteredChart} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado neste período. Complete tarefas do cronograma!</p>
            )}
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Reviews */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Próximas revisões
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
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma revisão agendada. Estude flashcards para começar!</p>
          )}
        </div>

        {/* Study Hours by Subject */}
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
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(hours / maxHours) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Gere um cronograma para ver a distribuição de horas.</p>
          )}
        </div>
      </div>

      {/* Topic Evolution */}
      <TopicEvolution />

      {/* Benchmark Comparativo */}
      <SpecialtyBenchmark />

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
    </div>
  );
};

export default Dashboard;
