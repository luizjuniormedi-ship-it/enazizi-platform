import { useEffect, useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRefreshUserState } from "@/hooks/useRefreshUserState";
import { useNavigate, useLocation } from "react-router-dom";
import { useMissionMode } from "@/hooks/useMissionMode";
import { useStudyEngine } from "@/hooks/useStudyEngine";
import { useExamReadiness } from "@/hooks/useExamReadiness";
import { usePreparationIndex } from "@/hooks/usePreparationIndex";
import { useCoreData } from "@/hooks/useCoreData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { buildStudyPath } from "@/lib/studyRouter";
import { getHumanReadableReason } from "@/lib/humanizedReasons";
import FocusHardMode from "@/components/study/FocusHardMode";
import MissionSituationCard from "@/components/mission/MissionSituationCard";
import MissionDiagnosticCard from "@/components/mission/MissionDiagnosticCard";
import MissionObjectiveCard from "@/components/mission/MissionObjectiveCard";
import MissionTaskList from "@/components/mission/MissionTaskList";
import MissionTaskActions from "@/components/mission/MissionTaskActions";
import MissionProgressFeedback from "@/components/mission/MissionProgressFeedback";
import MissionImpactProjection from "@/components/mission/MissionImpactProjection";
import MissionAlerts from "@/components/mission/MissionAlerts";
import MissionTutorHint from "@/components/mission/MissionTutorHint";
import MissionContinuity from "@/components/mission/MissionContinuity";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, Trophy, X, Clock, Sparkles, Rocket,
} from "lucide-react";

const TYPE_ICONS: Record<string, string> = {
  review: "🔄", error_review: "🔴", practice: "📝",
  clinical: "🏥", new: "📚", simulado: "🎯",
};

export default function MissionMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { refreshAll } = useRefreshUserState();
  const { user } = useAuth();
  const { adaptive } = useStudyEngine();
  const { data: examReadiness } = useExamReadiness();
  const { data: prepIndex } = usePreparationIndex();
  const { data: coreData } = useCoreData();

  const searchParams = new URLSearchParams(location.search);
  const manualFocusTotal = searchParams.get("focus") === "total";
  const autostartMission = searchParams.get("autostart") === "mission";
  const autostartFired = useRef(false);

  const invalidateDashboard = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  const {
    state, currentTask, nextTask, progress,
    totalMinutes, completedMinutes,
    engineLoading, hasTasks, startMission,
    completeCurrentTask, skipCurrentTask,
    pauseMission, resumeMission, endMission,
  } = useMissionMode();

  const [useFocusHard, setUseFocusHard] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const streak = coreData?.gamification?.current_streak ?? undefined;

  useEffect(() => {
    if (manualFocusTotal) { setUseFocusHard(true); return; }
    if (!user || !adaptive) return;
    const check = async () => {
      try {
        const { data: profile } = await supabase.from("profiles").select("exam_date").eq("user_id", user.id).maybeSingle();
        const daysToExam = profile?.exam_date ? Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86400000) : 999;
        setUseFocusHard(daysToExam <= 15 || (adaptive.approvalScore < 40 && adaptive.approvalScore > 0));
      } catch { setUseFocusHard(false); }
    };
    check();
  }, [user, adaptive, manualFocusTotal]);

  useEffect(() => {
    if (!autostartMission || autostartFired.current || state.status !== "idle") return;
    if (engineLoading) return;

    if (!hasTasks) {
      navigate("/dashboard", { replace: true });
      return;
    }

    autostartFired.current = true;
    startMission();
  }, [autostartMission, state.status, engineLoading, hasTasks, startMission, navigate]);

  useEffect(() => {
    if (state.status !== "idle") {
      if (autostartMission) {
        navigate("/dashboard/missao", { replace: true });
      }
      return;
    }

    if (autostartMission || autostartFired.current) return;
    navigate("/dashboard", { replace: true });
  }, [state.status, autostartMission, navigate]);

  if (state.status === "idle") return null;

  const handleEnd = () => { setShowExitConfirm(true); };
  const confirmEnd = () => { invalidateDashboard(); endMission(); navigate("/dashboard"); };
  const cancelEnd = () => { setShowExitConfirm(false); };

  // ── Mission Complete ──
  if (state.status === "completed") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-primary/30 shadow-2xl animate-fade-in">
          <CardContent className="p-8 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Missão Concluída! 🎉</h1>
              <p className="text-muted-foreground mt-2">
                Você completou {state.completedIds.length} de {state.tasks.length} tarefas
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Você reduziu risco de erro nos temas estudados hoje
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <div className="text-xl font-bold text-primary">{state.completedIds.length}</div>
                <div className="text-[10px] text-muted-foreground">Concluídas</div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <div className="text-xl font-bold">{completedMinutes}min</div>
                <div className="text-[10px] text-muted-foreground">Estudados</div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <div className="text-xl font-bold text-emerald-500">100%</div>
                <div className="text-[10px] text-muted-foreground">Progresso</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Sua missão foi atualizada com base no seu desempenho
            </p>
            <Button className="w-full gap-2" size="lg" onClick={handleEnd}>
              <Sparkles className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Focus Hard Mode ──
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
        onClose={handleEnd}
        onComplete={completeCurrentTask}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{TYPE_ICONS[currentTask.type] || "📋"}</span>
            <Badge variant="secondary">{currentTask.type}</Badge>
          </div>
          <p className="text-muted-foreground">{getHumanReadableReason(currentTask)}</p>
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

  const isAlmostDone = state.tasks.length > 0 && state.completedIds.length >= state.tasks.length - 1;

  // ── Active / Paused ──
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
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEnd}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 bg-card/50">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {state.status === "paused" ? (
          <div className="flex items-center justify-center h-full p-4">
            <Card className="max-w-sm w-full">
              <CardContent className="p-6 text-center space-y-4">
                <Pause className="h-12 w-12 text-muted-foreground mx-auto" />
                <h2 className="text-lg font-bold">Missão Pausada</h2>
                <p className="text-sm text-muted-foreground">Você pode retomar a qualquer momento.</p>
                <div className="flex gap-2">
                  <Button className="flex-1 gap-1.5" onClick={resumeMission}>
                    <Play className="h-4 w-4" /> Retomar
                  </Button>
                  <Button variant="outline" onClick={handleEnd}>Encerrar</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-lg mx-auto p-4 space-y-3 pb-8">
            {/* 1. Situação Atual */}
            <MissionSituationCard
              examReadiness={examReadiness || undefined}
              prepIndex={prepIndex}
              adaptive={adaptive}
            />

            {/* 2. Diagnóstico Inteligente */}
            <MissionDiagnosticCard adaptive={adaptive} streak={streak} />

            {/* 3. Objetivo do Dia */}
            <MissionObjectiveCard adaptive={adaptive} />

            {/* 8. Alertas Inteligentes */}
            <MissionAlerts adaptive={adaptive} streak={streak} />

            {/* 5. Execução Interativa (tarefa atual) */}
            {currentTask && (
              <MissionTaskActions
                task={currentTask}
                onComplete={completeCurrentTask}
                onSkip={skipCurrentTask}
              />
            )}

            {/* 9. Tutor IA Opcional */}
            <MissionTutorHint task={currentTask} adaptive={adaptive} />

            {/* 6. Feedback em Tempo Real */}
            <MissionProgressFeedback
              tasks={state.tasks}
              completedIds={state.completedIds}
              progress={progress}
              completedMinutes={completedMinutes}
              totalMinutes={totalMinutes}
            />

            {/* 7. Projeção de Impacto */}
            <MissionImpactProjection
              tasks={state.tasks}
              completedIds={state.completedIds}
              adaptive={adaptive}
            />

            {/* 4. Lista de Tarefas */}
            <MissionTaskList
              tasks={state.tasks}
              currentIndex={state.currentIndex}
              completedIds={state.completedIds}
            />

            {/* 10. Continuidade */}
            <MissionContinuity
              nextTask={nextTask}
              adaptive={adaptive}
              isAlmostDone={isAlmostDone}
            />

            {/* Pausar / Modo Livre */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 gap-1.5" size="sm" onClick={pauseMission}>
                <Pause className="h-3.5 w-3.5" /> Pausar
              </Button>
              <Button variant="ghost" className="flex-1" size="sm" onClick={handleEnd}>
                Modo Livre
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
