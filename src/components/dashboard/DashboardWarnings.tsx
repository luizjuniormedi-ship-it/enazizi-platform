import { AlertTriangle, Play, Flame, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMissionMode } from "@/hooks/useMissionMode";

interface WarningProps {
  todayCompleted: number;
  todayTotal: number;
  completedTasks: number;
  totalTasks: number;
  streak: number;
  daysUntilExam: number | null;
  questionsToday?: number;
  hasStudyPlan?: boolean;
}

interface ActionAlert {
  icon: React.ReactNode;
  title: string;
  message: string;
  buttonLabel: string;
  onAction: () => void;
  colorClass: string;
}

const DashboardWarnings = ({
  todayCompleted, todayTotal, completedTasks, totalTasks,
  streak, daysUntilExam, questionsToday = 0, hasStudyPlan = false,
}: WarningProps) => {
  const navigate = useNavigate();
  const { startMission } = useMissionMode();
  const hour = new Date().getHours();

  const startAndGo = () => {
    startMission();
    navigate("/dashboard/missao");
  };

  // Build prioritized list — only show the FIRST match
  // Priority 1: not studied today (after noon)
  if (questionsToday === 0 && hour >= 10) {
    return (
      <AlertBanner
        icon={<Play className="h-4 w-4" />}
        title="Você ainda não estudou hoje"
        message="Uma sessão rápida já faz diferença."
        buttonLabel="Começar agora"
        onAction={startAndGo}
        colorClass="border-primary/40 bg-primary/5 text-primary"
      />
    );
  }

  // Priority 2: exam close (<=15 days)
  if (daysUntilExam !== null && daysUntilExam <= 15) {
    return (
      <AlertBanner
        icon={<Clock className="h-4 w-4" />}
        title={`Faltam ${daysUntilExam} dias para a prova`}
        message="Foque nas revisões e nos temas com mais peso."
        buttonLabel="Modo intensivo"
        onAction={startAndGo}
        colorClass="border-destructive/40 bg-destructive/5 text-destructive"
      />
    );
  }

  // Priority 3: streak broken
  if (streak === 0 && questionsToday === 0 && hour >= 12) {
    return (
      <AlertBanner
        icon={<Flame className="h-4 w-4" />}
        title="Sua sequência de estudos zerou"
        message="Comece uma nova sequência agora."
        buttonLabel="Recomeçar"
        onAction={startAndGo}
        colorClass="border-orange-500/40 bg-orange-500/5 text-orange-600 dark:text-orange-400"
      />
    );
  }

  // Priority 4: no study plan
  if (!hasStudyPlan && totalTasks === 0) {
    return (
      <AlertBanner
        icon={<AlertTriangle className="h-4 w-4" />}
        title="Crie seu Plano Geral"
        message="Com um plano, o sistema organiza suas revisões automaticamente."
        buttonLabel="Criar plano"
        onAction={() => navigate("/dashboard/planner")}
        colorClass="border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400"
      />
    );
  }

  return null;
};

function AlertBanner({ icon, title, message, buttonLabel, onAction, colorClass }: ActionAlert) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 animate-fade-in ${colorClass}`}>
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs opacity-80">{message}</p>
      </div>
      <Button
        size="sm"
        className="shrink-0 text-xs h-8 gap-1.5 font-semibold"
        onClick={onAction}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

export default DashboardWarnings;
