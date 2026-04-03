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

/* ── Simplified Day Plan Row ── */
const STEP_ICONS: Record<string, string> = {
  review: "🔄",
  error_review: "❌",
  practice: "📝",
  clinical: "🩺",
  new: "📚",
  simulado: "📋",
};
const STEP_LABELS: Record<string, string> = {
  review: "Revisão",
  error_review: "Correção",
  practice: "Questões",
  clinical: "Clínica",
  new: "Conteúdo novo",
  simulado: "Simulado",
};

function DayPlanRow({ task }: { task: StudyRecommendation }) {
  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <span className="text-base">{STEP_ICONS[task.type] || "📖"}</span>
      <span className="flex-1 text-sm font-medium truncate">
        {STEP_LABELS[task.type] || task.type} — {task.topic}
      </span>
      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
        <Clock className="h-3 w-3" />
        {task.estimatedMinutes}min
      </span>
    </div>
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
    isMissionActive,
    isMissionPaused,
    isNewUser,
    tasks.length,
  );

  // ─── Mission Active/Paused ───
  if (isMissionActive || isMissionPaused) {
    return (
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-[0_0_40px_hsl(var(--primary)/0.12)] animate-fade-in overflow-hidden">
        <CardContent className="p-0">
          {/* Progress strip */}
          <div className="h-1.5 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base">{title}</p>
                <p className="text-xs text-muted-foreground">
                  {state.completedIds.length}/{state.tasks.length} tarefas · {completedMinutes}/{totalMinutes}min
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-bold px-2.5 py-1">
                {Math.round(progress)}%
              </Badge>
            </div>

            <Button
              className="w-full gap-2 font-bold text-lg py-6 shadow-lg shadow-primary/20"
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
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 animate-pulse" />
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
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <p className="font-bold text-lg">{title}</p>
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
        {/* ── Header ── */}
        <div className="p-5 pb-4 text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {topTask.topic} · ~{totalStudyMinutes}min
            </p>
          </div>

          {/* ── Primary CTA — biggest element ── */}
          <Button
            className="w-full gap-2 font-bold text-lg py-7 shadow-lg shadow-primary/20"
            size="lg"
            disabled={isLoading}
            onClick={handleStart}
          >
            <Play className="h-5 w-5" />
            COMEÇAR ESTUDO
          </Button>
        </div>

        {/* ── Day Plan (collapsible) ── */}
        <div className="border-t border-border/30">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>Ocultar plano <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Ver plano do dia ({tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}) <ChevronDown className="h-3 w-3" /></>
            )}
          </button>

          {expanded && (
            <div className="px-5 pb-4 divide-y divide-border/30 animate-fade-in">
              {tasks.slice(0, 4).map((task) => (
                <DayPlanRow key={task.id} task={task} />
              ))}
              {tasks.length > 4 && (
                <p className="text-[10px] text-center text-muted-foreground pt-2">
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
