import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const StreakCalendar = () => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["streak-calendar", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [gamifRes, attemptsRes, examRes, simRes, anamnesisRes, teacherSimRes] = await Promise.all([
        supabase.from("user_gamification")
          .select("current_streak, longest_streak, xp, level, weekly_xp")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase.from("practice_attempts")
          .select("created_at")
          .eq("user_id", user!.id)
          .gte("created_at", thirtyDaysAgo)
          .order("created_at", { ascending: true }),
        supabase.from("exam_sessions")
          .select("finished_at")
          .eq("user_id", user!.id)
          .eq("status", "finished")
          .gte("finished_at", thirtyDaysAgo),
        supabase.from("simulation_history")
          .select("created_at")
          .eq("user_id", user!.id)
          .gte("created_at", thirtyDaysAgo),
        supabase.from("anamnesis_results")
          .select("created_at")
          .eq("user_id", user!.id)
          .gte("created_at", thirtyDaysAgo),
        supabase.from("teacher_simulado_results")
          .select("created_at")
          .eq("student_id", user!.id)
          .gte("created_at", thirtyDaysAgo),
      ]);

      // Build activity map for last 30 days from ALL sources
      const activityDays = new Set<string>();
      const addDates = (rows: any[], field: string) => {
        (rows || []).forEach((r: any) => {
          if (r[field]) activityDays.add(new Date(r[field]).toISOString().split("T")[0]);
        });
      };
      addDates(attemptsRes.data || [], "created_at");
      addDates(examRes.data || [], "finished_at");
      addDates(simRes.data || [], "created_at");
      addDates(anamnesisRes.data || [], "created_at");
      addDates(teacherSimRes.data || [], "created_at");

      // Generate last 14 days for display
      const days: { date: string; label: string; active: boolean; isToday: boolean }[] = [];
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const iso = d.toISOString().split("T")[0];
        const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"];
        days.push({
          date: iso,
          label: dayNames[d.getDay()],
          active: activityDays.has(iso),
          isToday: i === 0,
        });
      }

      return {
        streak: gamifRes.data?.current_streak || 0,
        longestStreak: gamifRes.data?.longest_streak || 0,
        xp: gamifRes.data?.xp || 0,
        level: gamifRes.data?.level || 1,
        weeklyXp: gamifRes.data?.weekly_xp || 0,
        days,
      };
    },
  });

  if (!data) return null;

  const { streak, longestStreak, xp, level, weeklyXp, days } = data;
  const nextMilestone = Math.ceil(streak / 7) * 7;
  const milestoneProgress = streak > 0 ? ((streak % 7) / 7) * 100 : 0;

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header with streak fire */}
      <div className="flex items-center gap-4">
        <div className={cn(
          "relative h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0",
          streak > 0
            ? "bg-gradient-to-br from-orange-500/20 to-red-500/20"
            : "bg-muted"
        )}>
          <Flame className={cn(
            "h-8 w-8",
            streak > 0 ? "text-orange-500" : "text-muted-foreground"
          )} />
          {streak > 0 && (
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{streak}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg">
            {streak === 0
              ? "Comece seu streak!"
              : streak === 1
              ? "1 dia de streak!"
              : `${streak} dias de streak! 🔥`}
          </h3>
          <p className="text-xs text-muted-foreground">
            {streak === 0
              ? "Estude hoje para iniciar sua sequência"
              : `Recorde: ${longestStreak} dias • Nível ${level} • ${xp.toLocaleString()} XP`}
          </p>
        </div>
      </div>

      {/* Day circles - Duolingo style */}
      <div className="flex justify-between gap-1">
        {days.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <span className="text-[9px] text-muted-foreground font-medium">{day.label}</span>
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                day.active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : day.isToday
                  ? "border-2 border-dashed border-primary/40 text-muted-foreground"
                  : "bg-muted text-muted-foreground/50"
              )}
            >
              {day.active ? "✓" : day.isToday ? "?" : ""}
            </div>
          </div>
        ))}
      </div>

      {/* Milestone progress */}
      {streak > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              Próximo marco: {nextMilestone} dias
            </span>
            <span className="font-medium text-primary">{weeklyXp} XP esta semana</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
              style={{ width: `${milestoneProgress || 14}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakCalendar;
