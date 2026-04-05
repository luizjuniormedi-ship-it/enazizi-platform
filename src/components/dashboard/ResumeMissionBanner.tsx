import { useNavigate } from "react-router-dom";
import { useMissionMode } from "@/hooks/useMissionMode";
import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight } from "lucide-react";

/**
 * Sticky banner shown on Dashboard when a mission is active/paused.
 * Encourages the user to return to the mission flow.
 */
export default function ResumeMissionBanner() {
  const navigate = useNavigate();
  const { state, progress } = useMissionMode();

  if (state.status !== "active" && state.status !== "paused") return null;

  const remaining = state.tasks.length - state.completedIds.length;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {state.status === "paused" ? "Missão pausada" : "Missão em andamento"}
          </p>
          <p className="text-xs text-muted-foreground">
            {remaining} {remaining === 1 ? "tarefa restante" : "tarefas restantes"} · {progress}% concluído
          </p>
        </div>
      </div>
      <Button
        className="w-full gap-2 h-12 text-base font-bold"
        size="lg"
        onClick={() => navigate("/dashboard/missao")}
      >
        <ArrowRight className="h-5 w-5" />
        RETOMAR MISSÃO
      </Button>
    </div>
  );
}
