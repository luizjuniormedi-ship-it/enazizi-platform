import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ClassBenchmark = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ userPct: number; avgPct: number; percentile: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];

      // Get all users' daily plan completion for today
      const { data: plans } = await supabase
        .from("daily_plans")
        .select("user_id, completed_count, total_blocks")
        .eq("plan_date", today);

      if (!plans || plans.length < 2) return;

      const completions = plans
        .filter(p => p.total_blocks > 0)
        .map(p => Math.round((p.completed_count / p.total_blocks) * 100));

      const userPlan = plans.find(p => p.user_id === user.id);
      if (!userPlan || userPlan.total_blocks === 0) return;

      const userPct = Math.round((userPlan.completed_count / userPlan.total_blocks) * 100);
      const avgPct = Math.round(completions.reduce((a, b) => a + b, 0) / completions.length);
      const belowUser = completions.filter(c => c < userPct).length;
      const percentile = Math.round((belowUser / completions.length) * 100);

      setData({ userPct, avgPct, percentile });
    };
    load();
  }, [user]);

  if (!data) return null;

  const diff = data.userPct - data.avgPct;
  const TrendIcon = diff > 5 ? TrendingUp : diff < -5 ? TrendingDown : Minus;
  const trendColor = diff > 5 ? "text-green-500" : diff < -5 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-primary" />
        Comparação com a turma
      </h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-primary">{data.userPct}%</p>
          <p className="text-xs text-muted-foreground">Seu progresso</p>
        </div>
        <div>
          <p className="text-lg font-bold">{data.avgPct}%</p>
          <p className="text-xs text-muted-foreground">Média geral</p>
        </div>
        <div>
          <p className={`text-lg font-bold flex items-center justify-center gap-1 ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            Top {100 - data.percentile}%
          </p>
          <p className="text-xs text-muted-foreground">Seu ranking</p>
        </div>
      </div>
    </div>
  );
};

export default ClassBenchmark;
