import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { useStudyEngine, type StudyRecommendation } from "@/hooks/useStudyEngine";

export default function TodayStudyCard() {
  const navigate = useNavigate();
  const { data: recommendations, isLoading } = useStudyEngine();

  const topTask = recommendations?.[0];
  const remaining = recommendations ? recommendations.length - 1 : 0;

  if (isLoading) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 animate-pulse" />
            <div className="h-5 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-12 w-full bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!topTask) {
    return (
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-background">
        <CardContent className="p-5 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-foreground">Tudo em dia! 🎉</p>
          <p className="text-xs text-muted-foreground mt-1">
            Nenhuma tarefa pendente. Que tal estudar algo novo?
          </p>
        </CardContent>
      </Card>
    );
  }

  const TYPE_LABELS: Record<string, string> = {
    review: "Revisão",
    error_review: "Correção de Erros",
    practice: "Prática",
    clinical: "Prática Clínica",
    new: "Novo Tema",
    simulado: "Simulado",
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-base text-foreground">Hoje você deve estudar</h3>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-card border border-border/60">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary font-medium">
                  {TYPE_LABELS[topTask.type] || topTask.type}
                </Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {topTask.estimatedMinutes}min
                </span>
              </div>
              <p className="font-semibold text-sm truncate">{topTask.topic}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{topTask.reason}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">
            {remaining > 0 && `+ ${remaining} ${remaining === 1 ? "tarefa" : "tarefas"} programadas`}
          </span>
          <Button
            size="sm"
            className="gap-1.5 font-semibold"
            onClick={() => navigate(topTask.targetPath)}
          >
            <Play className="h-3.5 w-3.5" />
            Iniciar próximo bloco
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
