import { useNavigate } from "react-router-dom";
import { useMissionMode } from "@/hooks/useMissionMode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Rocket, Play, Loader2, Clock, ArrowRight } from "lucide-react";

export default function MissionStartButton() {
  const navigate = useNavigate();
  const {
    state, progress, totalMinutes, completedMinutes,
    engineLoading, hasTasks, startMission, resumeMission,
  } = useMissionMode();

  // Active or paused — show resume card
  if (state.status === "active" || state.status === "paused") {
    return (
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-[0_0_40px_hsl(var(--primary)/0.1)] animate-fade-in">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">Missão em andamento</p>
                <p className="text-[11px] text-muted-foreground">
                  {state.completedIds.length}/{state.tasks.length} tarefas · {completedMinutes}/{totalMinutes}min
                </p>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <Button
            className="w-full gap-2 font-bold text-base py-5"
            size="lg"
            onClick={() => {
              if (state.status === "paused") resumeMission();
              navigate("/dashboard/missao");
            }}
          >
            <ArrowRight className="h-5 w-5" />
            {state.status === "paused" ? "RETOMAR MISSÃO" : "CONTINUAR MISSÃO"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Idle — show start button
  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-[0_0_40px_hsl(var(--primary)/0.1)] animate-fade-in">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base">Missão do Dia</h3>
            <p className="text-xs text-muted-foreground">
              O sistema monta seu estudo ideal automaticamente
            </p>
          </div>
        </div>

        <Button
          className="w-full gap-2 font-bold text-lg py-6 shadow-lg shadow-primary/20"
          size="lg"
          disabled={engineLoading || !hasTasks}
          onClick={() => {
            startMission();
            navigate("/dashboard/missao");
          }}
        >
          {engineLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Preparando...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              COMEÇAR ESTUDO
            </>
          )}
        </Button>

        {!engineLoading && hasTasks && (
          <p className="text-[10px] text-center text-muted-foreground">
            Revisões → Conteúdo → Questões → Reforço → Avaliação
          </p>
        )}
      </CardContent>
    </Card>
  );
}
