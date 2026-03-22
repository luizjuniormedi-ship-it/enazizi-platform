import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bell, CalendarClock, Target, Flame, Brain } from "lucide-react";

interface SmartNotification {
  id: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: { label: string; path: string };
  severity: "info" | "warning" | "critical";
}

export default function SmartNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: notifications } = useQuery({
    queryKey: ["smart-notifications", user?.id],
    enabled: !!user,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const notifs: SmartNotification[] = [];
      const now = new Date();

      // 1. Overdue reviews
      const { count: overdueCount } = await supabase
        .from("revisoes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "pendente")
        .lt("data_revisao", now.toISOString().split("T")[0]);

      if (overdueCount && overdueCount > 0) {
        notifs.push({
          id: "overdue-reviews",
          icon: <CalendarClock className="h-4 w-4" />,
          title: `${overdueCount} ${overdueCount === 1 ? "revisão vencida" : "revisões vencidas"}`,
          message: "Revisões atrasadas aumentam o risco de esquecimento. Faça agora para manter a retenção.",
          action: { label: "Ir ao Cronograma", path: "/dashboard/cronograma" },
          severity: overdueCount > 5 ? "critical" : "warning",
        });
      }

      // 2. Daily question goal
      const todayStr = now.toISOString().split("T")[0];
      const { count: todayQuestions } = await supabase
        .from("practice_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", `${todayStr}T00:00:00`);

      const { data: configData } = await supabase
        .from("cronograma_config")
        .select("meta_questoes_dia")
        .eq("user_id", user!.id)
        .maybeSingle();

      const dailyGoal = configData?.meta_questoes_dia || 30;
      const questionsToday = todayQuestions || 0;
      const hour = now.getHours();

      if (hour >= 14 && questionsToday < dailyGoal * 0.5) {
        notifs.push({
          id: "daily-goal",
          icon: <Target className="h-4 w-4" />,
          title: `Meta diária: ${questionsToday}/${dailyGoal} questões`,
          message: `Você fez apenas ${Math.round((questionsToday / dailyGoal) * 100)}% da meta de hoje. Aproveite o restante do dia!`,
          action: { label: "Praticar Questões", path: "/dashboard/simulados" },
          severity: hour >= 18 ? "critical" : "warning",
        });
      }

      // 3. Streak risk
      const { data: gamData } = await supabase
        .from("user_gamification")
        .select("current_streak")
        .eq("user_id", user!.id)
        .maybeSingle();

      const streak = gamData?.current_streak || 0;
      if (streak >= 3 && hour >= 16 && questionsToday === 0) {
        notifs.push({
          id: "streak-risk",
          icon: <Flame className="h-4 w-4" />,
          title: `Streak de ${streak} dias em risco! 🔥`,
          message: "Você ainda não estudou hoje. Faça pelo menos 1 questão para não perder sua sequência!",
          action: { label: "Estudar Agora", path: "/dashboard/chatgpt" },
          severity: "warning",
        });
      }

      // 4. High forgetting risk topics
      const { data: highRiskReviews } = await supabase
        .from("revisoes")
        .select("id, temas_estudados(tema)")
        .eq("user_id", user!.id)
        .eq("status", "pendente")
        .eq("risco_esquecimento", "alto")
        .limit(5);

      if (highRiskReviews && highRiskReviews.length >= 2) {
        const topics = highRiskReviews
          .map((r: any) => r.temas_estudados?.tema)
          .filter(Boolean)
          .slice(0, 3);

        notifs.push({
          id: "forgetting-risk",
          icon: <Brain className="h-4 w-4" />,
          title: `${highRiskReviews.length} temas com alto risco de esquecimento`,
          message: topics.length > 0 ? `Temas: ${topics.join(", ")}` : "Revise agora para consolidar a memória.",
          action: { label: "Revisar Temas", path: "/dashboard/cronograma" },
          severity: "warning",
        });
      }

      return notifs;
    },
  });

  if (!notifications || notifications.length === 0) return null;

  const severityStyles = {
    info: "border-blue-500/30 bg-blue-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    critical: "border-destructive/30 bg-destructive/5",
  };

  const iconColors = {
    info: "text-blue-500",
    warning: "text-amber-500",
    critical: "text-destructive",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Notificações</span>
      </div>
      {notifications.slice(0, 3).map((n) => (
        <Alert key={n.id} className={`${severityStyles[n.severity]} py-3`}>
          <div className={iconColors[n.severity]}>{n.icon}</div>
          <AlertTitle className="text-sm font-semibold">{n.title}</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-2">
            <span className="text-xs">{n.message}</span>
            {n.action && (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-xs h-7"
                onClick={() => navigate(n.action!.path)}
              >
                {n.action.label}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
