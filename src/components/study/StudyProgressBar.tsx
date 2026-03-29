import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Thin real-time feedback bar shown at the bottom during study sessions.
 * Tracks today's progress and warns about patterns.
 */
export default function StudyProgressBar() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["study-progress-bar", user?.id],
    enabled: !!user,
    refetchInterval: 60 * 1000, // refresh every minute
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const startOfDay = `${today}T00:00:00Z`;

      const { count: total } = await supabase
        .from("practice_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", startOfDay);

      const { data: attempts } = await supabase
        .from("practice_attempts")
        .select("correct")
        .eq("user_id", user!.id)
        .gte("created_at", startOfDay)
        .order("created_at", { ascending: false })
        .limit(10);

      const recentCorrect = attempts?.filter((a) => a.correct).length ?? 0;
      const recentTotal = attempts?.length ?? 0;
      const recentAccuracy = recentTotal > 0 ? Math.round((recentCorrect / recentTotal) * 100) : 0;

      const goal = 20; // daily goal
      const progress = Math.min(((total || 0) / goal) * 100, 100);

      return { total: total || 0, goal, progress, recentAccuracy, recentTotal };
    },
  });

  if (!data || data.total === 0) return null;

  const getStatus = () => {
    if (data.recentAccuracy >= 80) return { icon: <TrendingUp className="h-3 w-3 text-emerald-500" />, msg: "Ótimo ritmo! 🔥", color: "text-emerald-500" };
    if (data.recentAccuracy >= 50) return { icon: <CheckCircle2 className="h-3 w-3 text-amber-500" />, msg: "Continue focado!", color: "text-amber-500" };
    return { icon: <AlertTriangle className="h-3 w-3 text-destructive" />, msg: "Revise antes de avançar", color: "text-destructive" };
  };

  const status = getStatus();

  return (
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t px-4 py-2 animate-fade-in">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              {data.total}/{data.goal} questões hoje
            </span>
            <span className={cn("text-[10px] font-medium flex items-center gap-1", status.color)}>
              {status.icon} {status.msg}
            </span>
          </div>
          <Progress value={data.progress} className="h-1.5" />
        </div>
      </div>
    </div>
  );
}
