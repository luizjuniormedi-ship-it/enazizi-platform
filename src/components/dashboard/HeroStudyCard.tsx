import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play, Rocket, ArrowRight, Loader2, Clock, Sparkles,
  CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { useMissionMode } from "@/hooks/useMissionMode";
import { useStudyEngine, type StudyRecommendation } from "@/hooks/useStudyEngine";
import { useSafeCta } from "@/hooks/useSafeCta";
import { buildStudyPath } from "@/lib/studyRouter";
import { getHumanReadableReason } from "@/lib/humanizedReasons";
import { useTopicEvolution, getEvolutionForTopic } from "@/hooks/useTopicEvolution";
import EvolutionBadge from "@/components/dashboard/EvolutionBadge";

const TYPE_LABELS: Record<string, string> = {
  review: "Revisão",
  error_review: "Correção",
  practice: "Prática",
  clinical: "Clínica",
  new: "Novo Tema",
  simulado: "Simulado",
};

const TYPE_COLORS: Record<string, string> = {
  review: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  error_review: "bg-destructive/15 text-destructive",
  practice: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  clinical: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  new: "bg-primary/15 text-primary",
  simulado: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

function TaskRow({ task, evolution }: {
  task: StudyRecommendation;
  evolution?: ReturnType<typeof getEvolutionForTopic>;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 font-medium border-0 ${TYPE_COLORS[task.type] || "bg-muted text-muted-foreground"}`}>
            {TYPE_LABELS[task.type] || task.type}
          </Badge>
          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {task.estimatedMinutes}min
          </span>
          {evolution && <EvolutionBadge status={evolution.status} />}
        </div>
        <p className="font-medium text-xs truncate">{task.topic}</p>
        <p className="text-[10px] text-muted-foreground line-clamp-1">
          💡 {getHumanReadableReason(task)}
        </p>
      </div>
    </div>
  );
}

const FLOW_STEPS = ["Revisão", "Conteúdo", "Questões", "Reforço"];

export default function HeroStudyCard() {
  const navigate = useNavigate();
  const { loading: starting, execute: safeCta } = useSafeCta();
  const {
    state, progress, totalMinutes, completedMinutes,
    engineLoading, hasTasks, startMission, resumeMission,
  } = useMissionMode();
  const { data: recommendations, isLoading: recLoading } = useStudyEngine();
  const { data: evolutions } = useTopicEvolution();
  const [expanded, setExpanded] = useState(false);

  const isLoading = engineLoading || starting || recLoading;
  const tasks = recommendations || [];
  const totalStudyMinutes = tasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
  const isMissionActive = state.status === "active" || state.status === "paused";

  // ─── Mission Active/Paused ───
  if (isMissionActive) {
    return (
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-[0_0_40px_hsl(var(--primary)/0.12)] animate-fade-in overflow-hidden">
        <CardContent className="p-0">
          {/* Progress strip */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Missão em andamento</p>
                <p className="text-[11px] text-muted-foreground">
                  {state.completedIds.length}/{state.tasks.length} tarefas · {completedMinutes}/{totalMinutes}min
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold">
                {Math.round(progress)}%
              </Badge>
            </div>

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
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading ───
  if (isLoading) {
    return (
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-[0_0_40px_hsl(var(--primary)/0.12)]">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 bg-muted animate-pulse rounded" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="h-14 w-full bg-muted animate-pulse rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  // ─── All Caught Up ───
  if (tasks.length === 0) {
    return (
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-background shadow-[0_0_30px_hsl(142_76%_36%/0.06)]">
        <CardContent className="p-5 text-center space-y-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <p className="font-bold text-foreground">Tudo em dia! 🎉</p>
          <p className="text-xs text-muted-foreground">
            Nenhuma tarefa pendente. Que tal explorar um módulo no acesso livre?
          </p>
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

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-[0_0_40px_hsl(var(--primary)/0.12)] animate-fade-in overflow-hidden">
      <CardContent className="p-0">
        {/* ── Header ── */}
        <div className="p-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base">Sua Missão de Hoje</h3>
              <p className="text-[11px] text-muted-foreground">
                {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"} · ~{totalStudyMinutes}min de estudo
              </p>
            </div>
          </div>

          {/* ── Flow Steps ── */}
          <div className="flex items-center gap-1 mb-3">
            {FLOW_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-1 flex-1">
                <div className="flex-1 h-1.5 rounded-full bg-primary/15">
                  <div className="h-full rounded-full bg-primary/40 w-0" />
                </div>
                <span className="text-[9px] text-muted-foreground font-medium whitespace-nowrap">
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* ── Primary CTA ── */}
          <Button
            className="w-full gap-2 font-bold text-lg py-6 shadow-lg shadow-primary/20"
            size="lg"
            disabled={isLoading}
            onClick={handleStart}
          >
            <Play className="h-5 w-5" />
            COMEÇAR ESTUDO
          </Button>
        </div>

        {/* ── Task Preview (collapsible) ── */}
        <div className="border-t border-border/30">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>Ocultar detalhes <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Ver o que você vai estudar <ChevronDown className="h-3 w-3" /></>
            )}
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-1.5 animate-fade-in">
              {tasks.slice(0, 5).map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  evolution={getEvolutionForTopic(evolutions, task.topic)}
                />
              ))}
              {tasks.length > 5 && (
                <p className="text-[10px] text-center text-muted-foreground pt-1">
                  +{tasks.length - 5} {tasks.length - 5 === 1 ? "tarefa" : "tarefas"} no plano completo
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
