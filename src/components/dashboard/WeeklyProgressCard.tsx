import { useEffect, useState } from "react";
import { CalendarRange, TrendingUp, TrendingDown, Minus, Target, Zap, BookOpen, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface WeeklyData {
  questionsThisWeek: number;
  questionsLastWeek: number;
  accuracyThisWeek: number;
  accuracyLastWeek: number;
  flashcardsReviewed: number;
  errorsLogged: number;
  simuladosCompleted: number;
  streakDays: number;
  studyHoursEstimate: number;
  topSpecialty: string | null;
  weakestSpecialty: string | null;
}

const WeeklyProgressCard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      const thisWeekISO = startOfWeek.toISOString();
      const lastWeekISO = startOfLastWeek.toISOString();

      const [attemptsThisWeek, attemptsLastWeek, flashcardsRes, errorsRes, examsRes, gamifRes, domainRes] = await Promise.all([
        supabase.from("practice_attempts").select("correct").eq("user_id", user.id).gte("created_at", thisWeekISO),
        supabase.from("practice_attempts").select("correct").eq("user_id", user.id).gte("created_at", lastWeekISO).lt("created_at", thisWeekISO),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", thisWeekISO),
        supabase.from("error_bank").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", thisWeekISO),
        supabase.from("exam_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "finished").gte("created_at", thisWeekISO),
        supabase.from("user_gamification").select("current_streak, weekly_xp").eq("user_id", user.id).maybeSingle(),
        supabase.from("medical_domain_map").select("specialty, domain_score").eq("user_id", user.id).order("domain_score", { ascending: false }),
      ]);

      const thisWeekAttempts = attemptsThisWeek.data || [];
      const lastWeekAttempts = attemptsLastWeek.data || [];

      const questionsThisWeek = thisWeekAttempts.length;
      const questionsLastWeek = lastWeekAttempts.length;
      const accuracyThisWeek = questionsThisWeek > 0 ? thisWeekAttempts.filter(a => a.correct).length / questionsThisWeek : 0;
      const accuracyLastWeek = questionsLastWeek > 0 ? lastWeekAttempts.filter(a => a.correct).length / questionsLastWeek : 0;

      const domains = domainRes.data || [];
      const topSpecialty = domains.length > 0 ? domains[0].specialty : null;
      const weakestSpecialty = domains.length > 1 ? domains[domains.length - 1].specialty : null;

      setData({
        questionsThisWeek,
        questionsLastWeek,
        accuracyThisWeek,
        accuracyLastWeek,
        flashcardsReviewed: flashcardsRes.count || 0,
        errorsLogged: errorsRes.count || 0,
        simuladosCompleted: examsRes.count || 0,
        streakDays: gamifRes.data?.current_streak || 0,
        studyHoursEstimate: Math.round((questionsThisWeek * 2 + (flashcardsRes.count || 0) * 0.5) / 60 * 10) / 10,
        topSpecialty,
        weakestSpecialty,
      });
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return (
      <div className="glass-card p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const questionsDelta = data.questionsThisWeek - data.questionsLastWeek;
  const accuracyDelta = data.accuracyThisWeek - data.accuracyLastWeek;

  const renderTrendIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
    if (delta < 0) return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const trendColor = (delta: number) =>
    delta > 0 ? "text-green-500" : delta < 0 ? "text-red-500" : "text-muted-foreground";

  const formatDelta = (delta: number, suffix = "") => {
    if (delta === 0) return "=";
    return `${delta > 0 ? "+" : ""}${delta}${suffix}`;
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          Progresso Semanal
        </h2>
        <span className="text-xs text-muted-foreground">vs. semana anterior</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Questions */}
        <div className="rounded-xl bg-secondary/50 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" /> Questões
          </div>
          <div className="text-xl font-bold">{data.questionsThisWeek}</div>
          <div className={`flex items-center gap-1 text-xs ${trendColor(questionsDelta)}`}>
            <TrendIcon delta={questionsDelta} />
            {formatDelta(questionsDelta)}
          </div>
        </div>

        {/* Accuracy */}
        <div className="rounded-xl bg-secondary/50 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" /> Acerto
          </div>
          <div className="text-xl font-bold">{Math.round(data.accuracyThisWeek * 100)}%</div>
          <div className={`flex items-center gap-1 text-xs ${trendColor(accuracyDelta)}`}>
            <TrendIcon delta={accuracyDelta} />
            {formatDelta(Math.round(accuracyDelta * 100), "%")}
          </div>
        </div>

        {/* Simulados */}
        <div className="rounded-xl bg-secondary/50 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" /> Simulados
          </div>
          <div className="text-xl font-bold">{data.simuladosCompleted}</div>
          <div className="text-xs text-muted-foreground">esta semana</div>
        </div>

        {/* Flashcards */}
        <div className="rounded-xl bg-secondary/50 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5" /> Revisões
          </div>
          <div className="text-xl font-bold">{data.flashcardsReviewed}</div>
          <div className="text-xs text-muted-foreground">flashcards</div>
        </div>
      </div>

      {/* Bottom insights */}
      <div className="flex flex-wrap gap-2 pt-1">
        {data.topSpecialty && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-semibold">
            🏆 Forte: {data.topSpecialty}
          </span>
        )}
        {data.weakestSpecialty && data.weakestSpecialty !== data.topSpecialty && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-semibold">
            ⚠️ Reforçar: {data.weakestSpecialty}
          </span>
        )}
        {data.errorsLogged > 0 && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold">
            🚨 {data.errorsLogged} erros registrados
          </span>
        )}
      </div>
    </div>
  );
};

export default WeeklyProgressCard;
