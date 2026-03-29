import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, ChevronRight, RotateCcw, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export default function DiagnosticSummaryCard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load last two sessions for comparison
  const { data: sessions } = useQuery({
    queryKey: ["diagnostic-sessions-latest", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("diagnostic_sessions" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(2);
      return (data || []) as any[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const latestSession = sessions?.[0];
  const previousSession = sessions?.[1];

  const { data: latestTopics } = useQuery({
    queryKey: ["diagnostic-topic-results-latest", latestSession?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("diagnostic_topic_results" as any)
        .select("*")
        .eq("session_id", latestSession!.id)
        .order("accuracy", { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!latestSession?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: previousTopics } = useQuery({
    queryKey: ["diagnostic-topic-results-prev", previousSession?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("diagnostic_topic_results" as any)
        .select("topic, accuracy")
        .eq("session_id", previousSession!.id);
      return (data || []) as any[];
    },
    enabled: !!previousSession?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!latestSession) return null;

  const score = Math.round(latestSession.score as number);
  const weakTopics = (latestTopics || []).filter((t: any) => t.accuracy < 60).slice(0, 3);

  // Check if stale (>30 days)
  const daysSince = (Date.now() - new Date(latestSession.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const isStale = daysSince >= 30;
  const canRetake = daysSince >= 30;

  // Build evolution map
  const prevMap: Record<string, number> = {};
  if (previousTopics) {
    for (const t of previousTopics) prevMap[t.topic] = t.accuracy;
  }
  const evolutions = (latestTopics || [])
    .filter((t: any) => prevMap[t.topic] !== undefined)
    .map((t: any) => ({
      topic: t.topic,
      diff: Math.round(t.accuracy - prevMap[t.topic]),
    }))
    .filter((e: any) => e.diff !== 0)
    .sort((a: any, b: any) => b.diff - a.diff);

  return (
    <Card className={`border-primary/20 ${isStale ? "border-yellow-500/30" : ""}`}>
      <CardContent className="p-4">
        {/* Stale alert */}
        {isStale && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-xs font-medium">
              Nivelamento desatualizado ({Math.round(daysSince)} dias). Refaça para atualizar seu perfil.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Nivelamento</p>
            <p className="text-xs text-muted-foreground">
              Score: <span className="font-bold text-foreground">{score}%</span>
              {" · "}{latestSession.correct_count}/{latestSession.total_questions} acertos
            </p>
          </div>
        </div>

        <Progress value={score} className="h-2 mb-3" />

        {/* Evolution from previous */}
        {evolutions.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Evolução vs anterior:</p>
            <div className="flex flex-wrap gap-1.5">
              {evolutions.slice(0, 4).map((e: any) => (
                <span
                  key={e.topic}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${
                    e.diff > 0
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {e.diff > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {e.topic} {e.diff > 0 ? "+" : ""}{e.diff}%
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weak topics */}
        {weakTopics.length > 0 && !evolutions.length && (
          <div className="mb-3">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">Áreas mais fracas:</p>
            <div className="flex flex-wrap gap-1.5">
              {weakTopics.map((t: any) => (
                <span
                  key={t.topic}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium"
                >
                  {t.topic} ({Math.round(t.accuracy)}%)
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-between text-xs h-8 text-primary"
            onClick={() => navigate("/dashboard/planner")}
          >
            <span>Ver plano baseado no nivelamento</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          {canRetake && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1"
              onClick={() => navigate("/dashboard/diagnostico")}
            >
              <RotateCcw className="h-3 w-3" />
              Refazer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
