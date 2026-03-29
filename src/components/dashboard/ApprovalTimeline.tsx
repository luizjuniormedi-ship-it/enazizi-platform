import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, Target, Clock } from "lucide-react";

interface TimelineData {
  score: number;
  daysUntilExam: number | null;
  weeklyGrowth: number;
  estimatedReadyDays: number;
}

export default function ApprovalTimeline() {
  const { user } = useAuth();

  const { data } = useQuery<TimelineData>({
    queryKey: ["approval-timeline", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Get latest 2 approval scores
      const { data: scores } = await supabase
        .from("approval_scores")
        .select("score, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(2);

      const current = scores?.[0]?.score ?? 0;
      const previous = scores?.[1]?.score ?? current;
      const weeklyGrowth = current - previous;

      // Get exam date
      const { data: profile } = await supabase
        .from("profiles")
        .select("exam_date")
        .eq("user_id", user!.id)
        .maybeSingle();

      const daysUntilExam = profile?.exam_date
        ? Math.max(0, Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86400000))
        : null;

      // Estimate days to reach 85% (ready)
      const gap = Math.max(0, 85 - current);
      const rate = weeklyGrowth > 0 ? weeklyGrowth : 1;
      const estimatedReadyDays = Math.ceil((gap / rate) * 7);

      return { score: current, daysUntilExam, weeklyGrowth, estimatedReadyDays };
    },
  });

  if (!data || data.score === 0) return null;

  const milestones = [
    { label: "Crítico", pct: 50, color: "text-destructive" },
    { label: "Atenção", pct: 70, color: "text-amber-500" },
    { label: "Competitivo", pct: 85, color: "text-primary" },
    { label: "Pronto", pct: 100, color: "text-emerald-500" },
  ];

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" /> Linha do tempo
          </h3>
          {data.weeklyGrowth !== 0 && (
            <span className={`text-xs font-medium ${data.weeklyGrowth > 0 ? "text-emerald-500" : "text-destructive"}`}>
              {data.weeklyGrowth > 0 ? "+" : ""}{data.weeklyGrowth.toFixed(1)}% semanal
            </span>
          )}
        </div>

        {/* Timeline bar */}
        <div className="relative">
          <Progress value={data.score} className="h-3 rounded-full" />
          <div className="flex justify-between mt-1">
            {milestones.map((m) => (
              <div key={m.label} className="text-center" style={{ width: "25%" }}>
                <div className={`text-[9px] font-medium ${data.score >= m.pct ? m.color : "text-muted-foreground"}`}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {data.daysUntilExam !== null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span><strong className="text-foreground">{data.daysUntilExam}</strong> dias p/ prova</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>~<strong className="text-foreground">{data.estimatedReadyDays}</strong> dias p/ pronto</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
