import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Target, Clock, BookOpen, CheckCircle2, Loader2, HelpCircle, Stethoscope, Award } from "lucide-react";
import ModuleHelpButton from "@/components/layout/ModuleHelpButton";
import PerformanceReport from "@/components/dashboard/PerformanceReport";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import AccuracyTrendChart from "@/components/analytics/AccuracyTrendChart";
import SpecialtyRadarChart from "@/components/analytics/SpecialtyRadarChart";

interface AnalyticsData {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalSessions: number;
  totalFlashcards: number;
  totalUploads: number;
  completedTasks: number;
  totalTasks: number;
  topicBreakdown: { topic: string; correct: number; total: number; rate: number }[];
  weeklyActivity: { day: string; tasks: number }[];
  examScores: { title: string; score: number; date: string }[];
  activityDates: string[];
  weeklyAccuracy: { week: string; accuracy: number; total: number }[];
  radarData: { specialty: string; score: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

const Analytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [attemptsRes, flashcardsRes, uploadsRes, tasksRes, examsRes, perfRes] = await Promise.all([
        supabase.from("practice_attempts").select("correct, created_at, question_id, questions_bank(topic)").eq("user_id", user.id),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("uploads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("study_tasks").select("completed, created_at").eq("user_id", user.id),
        supabase.from("exam_sessions").select("title, score, finished_at").eq("user_id", user.id).eq("status", "finished").order("finished_at", { ascending: false }).limit(10),
        supabase.from("study_performance").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      const attempts = attemptsRes.data || [];
      const correct = attempts.filter(a => a.correct).length;
      const tasks = tasksRes.data || [];
      const completedTasks = tasks.filter(t => t.completed).length;

      // Topic breakdown
      const topicMap: Record<string, { correct: number; total: number }> = {};
      for (const a of attempts) {
        const topic = (a as any).questions_bank?.topic || "Geral";
        if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
        topicMap[topic].total++;
        if (a.correct) topicMap[topic].correct++;
      }
      const topicBreakdown = Object.entries(topicMap)
        .map(([topic, v]) => ({ topic, ...v, rate: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0 }))
        .sort((a, b) => b.total - a.total);

      // Weekly activity (last 7 days)
      const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const weeklyActivity = days.map(day => ({ day, tasks: 0 }));
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      for (const t of tasks) {
        if (!t.completed) continue;
        const d = new Date(t.created_at);
        if (d >= weekAgo) weeklyActivity[d.getDay()].tasks++;
      }

      // Activity dates for heatmap (from attempts + completed tasks)
      const activityDateSet = new Set<string>();
      for (const a of attempts) {
        activityDateSet.add(new Date((a as any).created_at).toISOString().split("T")[0]);
      }
      for (const t of tasks) {
        if (t.completed) activityDateSet.add(new Date(t.created_at).toISOString().split("T")[0]);
      }
      const activityDates = Array.from(activityDateSet);

      // Weekly accuracy trend
      const weekMap: Record<string, { correct: number; total: number }> = {};
      for (const a of attempts) {
        const d = new Date((a as any).created_at);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = `${String(weekStart.getDate()).padStart(2, "0")}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
        if (!weekMap[key]) weekMap[key] = { correct: 0, total: 0 };
        weekMap[key].total++;
        if (a.correct) weekMap[key].correct++;
      }
      const weeklyAccuracy = Object.entries(weekMap)
        .map(([week, v]) => ({ week, accuracy: Math.round((v.correct / v.total) * 100), total: v.total }))
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-12);

      // Radar data from topic breakdown
      const radarData = topicBreakdown.slice(0, 8).map(t => ({ specialty: t.topic, score: t.rate }));

      // Exam scores
      const examScores = (examsRes.data || []).map(e => ({
        title: e.title || "Simulado",
        score: Number(e.score) || 0,
        date: e.finished_at ? new Date(e.finished_at).toLocaleDateString("pt-BR") : "",
      }));

      const sessionCount = perfRes.data ? ((perfRes.data.historico_estudo as any[]) || []).length : 0;

      setData({
        totalQuestions: attempts.length,
        correctAnswers: correct,
        accuracy: attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0,
        totalSessions: sessionCount,
        totalFlashcards: flashcardsRes.count || 0,
        totalUploads: uploadsRes.count || 0,
        completedTasks,
        totalTasks: tasks.length,
        topicBreakdown,
        weeklyActivity,
        examScores,
        activityDates,
        weeklyAccuracy,
        radarData,
      });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const maxTasks = Math.max(...data.weeklyActivity.map(d => d.tasks), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          <p className="text-muted-foreground">Seu desempenho real baseado nos dados da plataforma.</p>
        </div>
        <PerformanceReport />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <HelpCircle className="h-5 w-5 text-primary mb-2" />
          <div className="text-2xl font-bold">{data.totalQuestions}</div>
          <div className="text-xs text-muted-foreground">Questões respondidas</div>
        </div>
        <div className="glass-card p-4">
          <Target className="h-5 w-5 text-emerald-500 mb-2" />
          <div className="text-2xl font-bold">{data.accuracy}%</div>
          <div className="text-xs text-muted-foreground">Taxa de acerto</div>
        </div>
        <div className="glass-card p-4">
          <BookOpen className="h-5 w-5 text-violet-500 mb-2" />
          <div className="text-2xl font-bold">{data.totalSessions}</div>
          <div className="text-xs text-muted-foreground">Sessões de estudo</div>
        </div>
        <div className="glass-card p-4">
          <CheckCircle2 className="h-5 w-5 text-amber-500 mb-2" />
          <div className="text-2xl font-bold">{data.completedTasks}/{data.totalTasks}</div>
          <div className="text-xs text-muted-foreground">Tarefas concluídas</div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap dates={data.activityDates} />

      {/* Accuracy Trend + Radar side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccuracyTrendChart data={data.weeklyAccuracy} />
        <SpecialtyRadarChart data={data.radarData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Atividade semanal</h2>
          {data.weeklyActivity.every(d => d.tasks === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade na última semana.</p>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {data.weeklyActivity.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground">{d.tasks}</span>
                  <div
                    className="w-full rounded-t-lg bg-primary/80 transition-all hover:bg-primary min-h-[4px]"
                    style={{ height: `${(d.tasks / maxTasks) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topic Breakdown */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Desempenho por especialidade</h2>
          {data.topicBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Responda questões para ver seu desempenho por área.</p>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {data.topicBreakdown.slice(0, 10).map((t, i) => (
                <div key={t.topic} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 truncate">{t.topic}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${t.rate}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                  <span className={`text-xs font-medium w-12 text-right ${t.rate >= 70 ? "text-emerald-500" : t.rate >= 50 ? "text-amber-500" : "text-destructive"}`}>
                    {t.rate}%
                  </span>
                  <span className="text-xs text-muted-foreground w-10 text-right">{t.total}Q</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exam Scores */}
      {data.examScores.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Simulados realizados
          </h2>
          <div className="space-y-2">
            {data.examScores.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <span className="text-sm font-medium">{e.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">{e.date}</span>
                </div>
                <span className={`text-sm font-bold ${e.score >= 70 ? "text-emerald-500" : e.score >= 50 ? "text-amber-500" : "text-destructive"}`}>
                  {e.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <Stethoscope className="h-5 w-5 text-primary mx-auto mb-2" />
          <div className="text-lg font-bold">{data.totalFlashcards}</div>
          <div className="text-xs text-muted-foreground">Flashcards criados</div>
        </div>
        <div className="glass-card p-4 text-center">
          <BookOpen className="h-5 w-5 text-primary mx-auto mb-2" />
          <div className="text-lg font-bold">{data.totalUploads}</div>
          <div className="text-xs text-muted-foreground">Materiais enviados</div>
        </div>
        <div className="glass-card p-4 text-center">
          <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
          <div className="text-lg font-bold">{data.examScores.length}</div>
          <div className="text-xs text-muted-foreground">Simulados completos</div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
