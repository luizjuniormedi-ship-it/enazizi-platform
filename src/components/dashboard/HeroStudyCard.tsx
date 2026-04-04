import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play, Rocket, ArrowRight, Clock, Sparkles,
  CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { useMissionMode } from "@/hooks/useMissionMode";
import { useStudyEngine, type StudyRecommendation } from "@/hooks/useStudyEngine";
import { useSafeCta } from "@/hooks/useSafeCta";
import { buildStudyPath } from "@/lib/studyRouter";
import { useDashboardData } from "@/hooks/useDashboardData";
import { getHumanReadableReason } from "@/lib/humanizedReasons";

/* ── Dynamic Title Logic ── */
function getDynamicTitle(
  missionActive: boolean,
  missionPaused: boolean,
  isNewUser: boolean,
  tasksCount: number,
): { title: string; subtitle: string } {
  if (missionPaused) return { title: "Vamos continuar de onde você parou", subtitle: "Sua missão está pausada" };
  if (missionActive) return { title: "Missão em andamento", subtitle: "Continue para manter o ritmo" };
  if (isNewUser) return { title: "Sua primeira missão está pronta", subtitle: "Comece agora e veja seu progresso" };
  if (tasksCount === 0) return { title: "Tudo em dia! 🎉", subtitle: "Nenhuma tarefa pendente" };

  const hour = new Date().getHours();
  if (hour < 12) return { title: "Pronto para continuar?", subtitle: "Sua missão de hoje está pronta" };
  if (hour < 18) return { title: "Sua missão de hoje está pronta", subtitle: "Foco e consistência levam ao resultado" };
  return { title: "Ainda dá tempo hoje", subtitle: "Uma sessão antes de dormir faz diferença" };
}

/* ── Day Plan Row — thumb-friendly ── */
const STEP_ICONS: Record<string, string> = {
  review: "🔄", error_review: "❌", practice: "📝",
  clinical: "🩺", new: "📚", simulado: "📋",
};
const STEP_LABELS: Record<string, string> = {
  review: "Revisão", error_review: "Correção", practice: "Questões",
  clinical: "Clínica", new: "Conteúdo novo", simulado: "Simulado",
};

function DayPlanRow({ task, onTap }: { task: StudyRecommendation; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 py-3 px-2 active:bg-muted/50 transition-colors rounded-lg text-left"
    >
      <span className="text-lg shrink-0">{STEP_ICONS[task.type] || "📖"}</span>
      <span className="flex-1 text-sm font-medium truncate">
        {STEP_LABELS[task.type] || task.type} — {task.topic}
      </span>
      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
        <Clock className="h-3 w-3" />
        {task.estimatedMinutes}min
      </span>
    </button>
  );
}

export default function HeroStudyCard() {
  const navigate = useNavigate();
  const { loading: starting, execute: safeCta } = useSafeCta();
  const {
    state, progress, totalMinutes, completedMinutes,
    engineLoading, hasTasks, startMission, resumeMission,
  } = useMissionMode();
  const { data: recommendations, isLoading: recLoading } = useStudyEngine();
  const { data: dashData } = useDashboardData();
  const [expanded, setExpanded] = useState(false);

  const isLoading = engineLoading || starting || recLoading;
  const tasks = recommendations || [];
  const totalStudyMinutes = tasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
  const isMissionActive = state.status === "active";
  const isMissionPaused = state.status === "paused";
  const isNewUser = dashData
    ? (dashData.metrics.questionsAnswered === 0 && dashData.stats.flashcards === 0)
    : false;

  const { title, subtitle } = getDynamicTitle(
    isMissionActive, isMissionPaused, isNewUser, tasks.length,
  );

  // ─── Mission Active/Paused ───
  if (isMissionActive || isMissionPaused) {
    return (
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-[0_0_40px_hsl(var(--primary)/0.12)] animate-fade-in overflow-hidden">
        <CardContent className="p-0">
          <div className="h-2 bg-muted">
            <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse shrink-0">
                <Rocket className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg leading-tight">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {state.completedIds.length}/{state.tasks.length} tarefas · {completedMinutes}/{totalMinutes}min
                </p>
              </div>
              <Badge variant="outline" className="text-sm font-bold px-3 py-1.5 shrink-0">
                {Math.round(progress)}%
              </Badge>
            </div>
            <Button
              className="w-full gap-2 font-bold text-lg h-14 shadow-lg shadow-primary/20"
              size="lg"
              onClick={() => {
                if (isMissionPaused) resumeMission();
                navigate("/dashboard/missao");
              }}
            >
              <ArrowRight className="h-5 w-5" />
              {isMissionPaused ? "RETOMAR MISSÃO" : "CONTINUAR MISSÃO"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading ───
  if (isLoading) {
    return (
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-[0_0_40px_hsl(var(--primary)/0.12)]">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 animate-pulse" />
            <div className="h-5 w-56 bg-muted animate-pulse rounded" />
            <div className="h-14 w-full bg-muted animate-pulse rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── All Caught Up ───
  if (tasks.length === 0) {
    return (
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-background shadow-[0_0_30px_hsl(142_70%_45%/0.08)]">
        <CardContent className="p-6 sm:p-8 text-center space-y-3">
          <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
          <p className="font-bold text-xl">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </CardContent>
      </Card>
    );
  }

  // ─── Main: Idle with tasks ───
  const handleStart = () => {
    safeCta({
      action: () => { startMission(); },
      nextStep: "/dashboard/missao",
      errorMessage: "Não foi possível iniciar. Tente novamente.",
    });
  };

  const topTask = tasks[0];

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-[0_0_40px_hsl(var(--primary)/0.12)] animate-fade-in overflow-hidden">
      <CardContent className="p-0">
        {/* ── Header — fills first screen on mobile ── */}
        <div className="p-5 sm:p-6 pb-5 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-xl leading-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {topTask.topic} · ~{totalStudyMinutes}min
            </p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              💡 {getHumanReadableReason(topTask)}
            </p>
          </div>

          {/* ── Primary CTA — min 56px height, thumb-friendly ── */}
          <Button
            className="w-full gap-2.5 font-bold text-lg h-14 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
            size="lg"
            disabled={isLoading}
            onClick={handleStart}
          >
            <Play className="h-5 w-5" />
            COMEÇAR ESTUDO
          </Button>
        </div>

        {/* ── Day Plan (collapsible, tappable rows) ── */}
        <div className="border-t border-border/30">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-foreground active:bg-muted/30 transition-colors"
          >
            {expanded ? (
              <>Ocultar plano <ChevronUp className="h-3.5 w-3.5" /></>
            ) : (
              <>Ver plano do dia ({tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}) <ChevronDown className="h-3.5 w-3.5" /></>
            )}
          </button>

          {expanded && (
            <div className="px-4 sm:px-5 pb-4 divide-y divide-border/30 animate-fade-in">
              {tasks.slice(0, 4).map((task) => (
                <DayPlanRow
                  key={task.id}
                  task={task}
                  onTap={() => navigate(buildStudyPath(task, "daily-plan"))}
                />
              ))}
              {tasks.length > 4 && (
                <p className="text-xs text-center text-muted-foreground pt-3">
                  +{tasks.length - 4} {tasks.length - 4 === 1 ? "tarefa" : "tarefas"} no plano completo
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
