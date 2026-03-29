import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, ChevronRight, RotateCcw } from "lucide-react";

export default function DiagnosticSummaryCard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: session } = useQuery({
    queryKey: ["diagnostic-session-latest", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("diagnostic_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: topicResults } = useQuery({
    queryKey: ["diagnostic-topic-results", session?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("diagnostic_topic_results")
        .select("*")
        .eq("session_id", session!.id)
        .order("accuracy", { ascending: true });
      return data || [];
    },
    enabled: !!session?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!session) return null;

  const score = Math.round(session.score as number);
  const weakTopics = (topicResults || []).filter((t: any) => t.accuracy < 60).slice(0, 3);

  const canRetake = (() => {
    const lastDate = new Date(session.created_at);
    const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 30;
  })();

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Nivelamento</p>
            <p className="text-xs text-muted-foreground">
              Score: <span className="font-bold text-foreground">{score}%</span>
              {" · "}{session.correct_count}/{session.total_questions} acertos
            </p>
          </div>
        </div>

        <Progress value={score} className="h-2 mb-3" />

        {weakTopics.length > 0 && (
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
              onClick={() => navigate("/dashboard/nivelamento")}
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
