import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const DailyGoalWidget = () => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["daily-goal", user?.id],
    enabled: !!user,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const [configRes, attemptsRes, examRes] = await Promise.all([
        supabase.from("cronograma_config").select("meta_questoes_dia").eq("user_id", user!.id).maybeSingle(),
        supabase.from("practice_attempts").select("id", { count: "exact", head: true }).eq("user_id", user!.id).gte("created_at", `${today}T00:00:00`),
        supabase.from("exam_sessions").select("total_questions").eq("user_id", user!.id).eq("status", "finished").gte("finished_at", `${today}T00:00:00`),
      ]);

      const goal = configRes.data?.meta_questoes_dia || 30;
      const practiceCount = attemptsRes.count || 0;
      const examQuestions = (examRes.data || []).reduce((sum: number, e: any) => sum + (e.total_questions || 0), 0);
      const done = practiceCount + examQuestions;

      return { goal, done };
    },
  });

  if (!data) return null;

  const { goal, done } = data;
  const percent = Math.min(Math.round((done / goal) * 100), 100);
  const isComplete = done >= goal;

  // SVG circle math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="glass-card p-5 flex items-center gap-5 border-primary/10">
      {/* Circular progress */}
      <div className="relative flex-shrink-0">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            className="stroke-secondary"
            strokeWidth="6"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            className={isComplete ? "stroke-green-500" : "stroke-primary"}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold ${isComplete ? "text-green-500" : "text-foreground"}`}>{percent}%</span>
          <span className="text-[10px] text-muted-foreground">da meta</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Target className="h-4 w-4 text-primary" />
          Meta diária de questões
        </h3>
        <p className="text-2xl font-bold mt-1">
          {done} <span className="text-sm font-normal text-muted-foreground">/ {goal}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isComplete
            ? "🎉 Meta atingida! Continue praticando."
            : `Faltam ${goal - done} questões para completar`}
        </p>
      </div>

      {/* CTA */}
      {!isComplete && (
        <Link to="/dashboard/banco-questoes" className="flex-shrink-0">
          <Button size="sm" className="gap-1.5">
            <Zap className="h-4 w-4" />
            Praticar
          </Button>
        </Link>
      )}
    </div>
  );
};

export default DailyGoalWidget;
