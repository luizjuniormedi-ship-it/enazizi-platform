import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PracticalPerformanceCard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["practical-performance", user?.id],
    queryFn: async () => {
      const { data: results } = await supabase
        .from("practical_exam_results")
        .select("final_score, specialty, scores_json, created_at, feedback_json")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return results || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data || data.length === 0) return null;

  const avgScore = data.reduce((s, r) => s + (r.final_score || 0), 0) / data.length;
  const latest = data[0];
  const previous = data.length > 1 ? data.slice(1, 4) : [];
  const prevAvg = previous.length > 0
    ? previous.reduce((s, r) => s + (r.final_score || 0), 0) / previous.length
    : avgScore;
  const trend = avgScore - prevAvg;

  const TrendIcon = trend > 0.5 ? TrendingUp : trend < -0.5 ? TrendingDown : Minus;
  const trendColor = trend > 0.5 ? "text-emerald-500" : trend < -0.5 ? "text-red-500" : "text-muted-foreground";

  const gradeColor = (score: number) => {
    if (score >= 9) return "bg-emerald-500/10 text-emerald-600";
    if (score >= 7) return "bg-blue-500/10 text-blue-600";
    if (score >= 5) return "bg-yellow-500/10 text-yellow-700";
    return "bg-red-500/10 text-red-600";
  };

  // Extract last error from feedback
  const lastFeedback = latest.feedback_json as any;
  const lastErrors = lastFeedback?.feedback?.filter((f: any) => !f.correct) || [];
  const lastErrorComment = lastErrors[0]?.comment || null;

  return (
    <Card className="border-violet-500/15">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-violet-500" />
            Desempenho Prático
          </div>
          <Badge variant="outline" className={gradeColor(avgScore)}>
            Média: {avgScore.toFixed(1)}/10
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold">{data.length}</p>
            <p className="text-[10px] text-muted-foreground">Provas feitas</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold">{latest.final_score?.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Última nota</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 flex flex-col items-center">
            <div className="flex items-center gap-1">
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
              <span className={`text-lg font-bold ${trendColor}`}>
                {trend > 0 ? "+" : ""}{trend.toFixed(1)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Evolução</p>
          </div>
        </div>

        {/* Last error */}
        {lastErrorComment && (
          <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
            <p className="text-[10px] font-medium text-red-600 dark:text-red-400">
              ⚠️ Último erro: {lastErrorComment.slice(0, 100)}
            </p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => navigate("/dashboard/prova-pratica")}
        >
          Praticar agora <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
