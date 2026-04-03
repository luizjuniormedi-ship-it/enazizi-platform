import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useMissionMode } from "@/hooks/useMissionMode";
import { useStudyEngine } from "@/hooks/useStudyEngine";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { buildStudyPath } from "@/lib/studyRouter";
import FocusHardMode from "@/components/study/FocusHardMode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, SkipForward, CheckCircle2, Trophy,
  ArrowRight, X, Clock, Sparkles, Rocket, Target, ChevronDown,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const TYPE_LABELS: Record<string, string> = {
  review: "Revisão",
  error_review: "Correção de Erros",
  practice: "Prática de Questões",
  clinical: "Treino Clínico",
  new: "Novo Conteúdo",
  simulado: "Simulado",
};

const TYPE_ICONS: Record<string, string> = {
  review: "🔄",
  error_review: "🔴",
  practice: "📝",
  clinical: "🏥",
  new: "📚",
  simulado: "🎯",
};

export default function MissionMode() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { adaptive } = useStudyEngine();

  const invalidateDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
  }, [queryClient]);
  const {
    state, currentTask, nextTask, progress,
    totalMinutes, completedMinutes,
    completeCurrentTask, skipCurrentTask,
    pauseMission, resumeMission, endMission,
  } = useMissionMode();
  const [taskListOpen, setTaskListOpen] = useState(false);
  const [useFocusHard, setUseFocusHard] = useState(false);

  // Check if Focus Hard Mode should activate
  useEffect(() => {
    if (!user || !adaptive) return;
    const checkFocusHard = async () => {
      try {
        const { data: profile } = await supabase.from("profiles").select("exam_date").eq("user_id", user.id).maybeSingle();
        const examDate = profile?.exam_date;
        const daysToExam = examDate ? Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000) : 999;
        setUseFocusHard(daysToExam <= 15 || (adaptive.approvalScore < 40 && adaptive.approvalScore > 0));
      } catch (e) {
        console.warn("[MissionMode] Erro ao verificar Focus Hard:", e);
        setUseFocusHard(false);
      }
    };
    checkFocusHard();
  }, [user, adaptive]);

  // Redirect if no active mission
  useEffect(() => {
    if (state.status === "idle") {
      navigate("/dashboard", { replace: true });
    }
  }, [state.status, navigate]);

  if (state.status === "idle") return null;

  // ── Mission Complete Screen ──
  if (state.status === "completed") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-primary/30 shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Missão Concluída! 🎉</h1>
              <p className="text-muted-foreground mt-2">
                Você completou {state.completedIds.length} de {state.tasks.length} tarefas
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <div className="text-xl font-bold text-primary">{state.completedIds.length}</div>
                <div className="text-[10px] text-muted-foreground">Concluídas</div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <div className="text-xl font-bold text-foreground">{completedMinutes}min</div>
                <div className="text-[10px] text-muted-foreground">Estudados</div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <div className="text-xl font-bold text-emerald-500">100%</div>
                <div className="text-[10px] text-muted-foreground">Progresso</div>
              </div>
            </div>

            <Button className="w-full gap-2" size="lg" onClick={() => { endMission(); navigate("/dashboard"); }}>
              <Sparkles className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Focus Hard Mode (auto-activated) ──
  if (useFocusHard && state.status === "active" && currentTask) {
    const focusReason = adaptive?.approvalScore && adaptive.approvalScore < 40
      ? "Score baixo — foco total necessário"
      : "Prova próxima — concentração máxima";
    return (
      <FocusHardMode
        taskTitle={currentTask.topic}
        taskType={currentTask.type}
        estimatedMinutes={currentTask.estimatedMinutes}
        reason={focusReason}
        onClose={() => { endMission(); navigate("/dashboard"); }}
        onComplete={() => { completeCurrentTask(); }}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{TYPE_ICONS[currentTask.type] || "📋"}</span>
            <Badge variant="secondary">{TYPE_LABELS[currentTask.type]}</Badge>
          </div>
          <p className="text-muted-foreground">{currentTask.reason}</p>
          <Button
            className="w-full gap-2 py-6"
            size="lg"
            onClick={() => navigate(buildStudyPath(currentTask, "mission"))}
          >
            <Play className="h-5 w-5" />
            Iniciar Atividade
          </Button>
        </div>
      </FocusHardMode>
    );
  }

  // ── Active / Paused Mission ──
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Missão do Dia</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {completedMinutes}/{totalMinutes}min
          </span>
          <Badge variant="secondary" className="text-xs">
            {state.completedIds.length}/{state.tasks.length}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { endMission(); navigate("/dashboard"); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 bg-card/50">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{progress}% concluído</span>
          <span className="text-[10px] text-muted-foreground">
            Tarefa {Math.min(state.currentIndex + 1, state.tasks.length)} de {state.tasks.length}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        {state.status === "paused" ? (
          <Card className="max-w-sm w-full">
            <CardContent className="p-6 text-center space-y-4">
              <Pause className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-lg font-bold">Missão Pausada</h2>
              <p className="text-sm text-muted-foreground">
                Você pode retomar a qualquer momento.
              </p>
              <div className="flex gap-2">
                <Button className="flex-1 gap-1.5" onClick={resumeMission}>
                  <Play className="h-4 w-4" /> Retomar
                </Button>
                <Button variant="outline" onClick={() => { endMission(); navigate("/dashboard"); }}>
                  Encerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : currentTask ? (
          <div className="max-w-md w-full space-y-4">
            {/* Current Task Card */}
            <Card className="border-primary/30 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{TYPE_ICONS[currentTask.type] || "📋"}</span>
                  <Badge variant="secondary" className="text-xs">
                    {TYPE_LABELS[currentTask.type] || currentTask.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{currentTask.estimatedMinutes}min
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold">{currentTask.topic}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{currentTask.reason}</p>
                  {adaptive?.focusReason && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                      <Target className="h-3 w-3 shrink-0" />
                      {adaptive.focusReason}
                    </p>
                  )}
                </div>

                <Button
                  className="w-full gap-2 text-base py-6"
                  size="lg"
                  onClick={() => navigate(buildStudyPath(currentTask, "mission"))}
                >
                  <Play className="h-5 w-5" />
                  Iniciar Atividade
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    size="sm"
                    onClick={completeCurrentTask}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Já concluí
                  </Button>
                  <Button
                    variant="ghost"
                    className="gap-1.5"
                    size="sm"
                    onClick={skipCurrentTask}
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    Pular
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Next Up Preview */}
            {nextTask && (
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Próximo</p>
                    <p className="text-sm font-medium truncate">{nextTask.topic}</p>
                  </div>
                  <span className="text-2xl">{TYPE_ICONS[nextTask.type] || "📋"}</span>
                </CardContent>
              </Card>
            )}

            {/* Task List — collapsible by default */}
            <Collapsible open={taskListOpen} onOpenChange={setTaskListOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground text-xs">
                  <span>Ver todas as tarefas ({state.tasks.length})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${taskListOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5 mt-1">
                {state.tasks.map((task, idx) => {
                  const isCompleted = state.completedIds.includes(task.id);
                  const isCurrent = idx === state.currentIndex;
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                        isCurrent
                          ? "bg-primary/10 border border-primary/30"
                          : isCompleted
                          ? "bg-muted/50 text-muted-foreground"
                          : "bg-card/30"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : isCurrent ? (
                        <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />
                      )}
                      <span className={`truncate ${isCompleted ? "line-through" : ""}`}>
                        {task.topic}
                      </span>
                      <span className="ml-auto text-muted-foreground">{TYPE_ICONS[task.type]}</span>
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            {/* Pause / Free mode */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 gap-1.5" size="sm" onClick={pauseMission}>
                <Pause className="h-3.5 w-3.5" /> Pausar
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                size="sm"
                onClick={() => { endMission(); navigate("/dashboard"); }}
              >
                Modo Livre
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
