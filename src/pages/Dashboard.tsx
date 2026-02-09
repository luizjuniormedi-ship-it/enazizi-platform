import { CalendarDays, FlipVertical, FileText, Upload, TrendingUp, Clock, BookOpen, CheckCircle2, Loader2, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";

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
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [flashcardsRes, uploadsRes, tasksRes, plansRes, reviewsRes] = await Promise.all([
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("uploads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("study_tasks").select("completed").eq("user_id", user.id),
        supabase.from("study_plans").select("plan_json").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("reviews").select("next_review, flashcard_id, flashcards(topic)").eq("user_id", user.id).gte("next_review", new Date().toISOString()).order("next_review", { ascending: true }).limit(5),
      ]);

      const tasks = tasksRes.data || [];
      const completedTasks = tasks.filter((t) => t.completed).length;

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
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {stats.daysUntilExam
            ? `${stats.daysUntilExam} dias até a prova • ${taskPercent}% das tarefas concluídas`
            : "Bem-vindo de volta! Aqui está seu progresso."}
        </p>
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
