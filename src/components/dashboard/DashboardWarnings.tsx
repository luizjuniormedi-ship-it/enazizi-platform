import { AlertTriangle, BookOpen } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

interface Warning {
  title: string;
  message: string;
  severity: "red" | "orange";
  action?: { label: string; path: string };
}

const DashboardWarnings = ({
  todayCompleted, todayTotal, completedTasks, totalTasks,
  streak, daysUntilExam, questionsToday = 0, hasStudyPlan = false,
}: WarningProps) => {
  const navigate = useNavigate();
  const warnings: Warning[] = [];
  const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const hour = new Date().getHours();

  // Real activity: no questions answered today and it's past noon
  if (questionsToday === 0 && hour >= 12) {
    warnings.push({
      title: "Você ainda não estudou hoje!",
      message: "O dia está passando e você não respondeu nenhuma questão. Cada dia sem estudar é um dia mais longe do seu sonho!",
      severity: "red",
      action: { label: "Estudar Agora", path: "/dashboard/simulados" },
    });
  }

  // Schedule warnings only if user has a study plan
  if (hasStudyPlan) {
    if (todayTotal > 2 && todayCompleted > 0 && todayCompleted < todayTotal * 0.5 && hour >= 17) {
      warnings.push({
        title: "Seu progresso de hoje está baixo",
        message: `Você completou apenas ${todayCompleted} de ${todayTotal} blocos. Aproveite o tempo que resta!`,
        severity: "orange",
      });
    }

    if (totalTasks > 5 && taskPercent < 30) {
      warnings.push({
        title: "Seu cronograma está ficando para trás!",
        message: `Apenas ${taskPercent}% das suas tarefas foram concluídas. Retome o foco agora!`,
        severity: "red",
        action: { label: "Ver Cronograma", path: "/dashboard/cronograma" },
      });
    }
  }

  // No study plan configured — suggest creating one
  if (!hasStudyPlan && totalTasks === 0) {
    warnings.push({
      title: "Configure seu cronograma de estudos",
      message: "Crie um plano de estudo personalizado para acompanhar seu progresso e receber lembretes inteligentes.",
      severity: "orange",
      action: { label: "Criar Plano", path: "/dashboard/planner" },
    });
  }

  // Lost streak
  if (streak === 0 && questionsToday === 0 && hour >= 14) {
    warnings.push({
      title: "Sua sequência de estudos zerou!",
      message: "Grandes aprovações exigem constância. Comece uma nova sequência hoje!",
      severity: "orange",
      action: { label: "Começar Agora", path: "/dashboard/chatgpt" },
    });
  }

  // Close to exam with low progress
  if (daysUntilExam !== null && daysUntilExam <= 30 && taskPercent < 50 && hasStudyPlan) {
    warnings.push({
      title: `⚠️ Faltam ${daysUntilExam} dias para a prova!`,
      message: `Restam ${daysUntilExam} dias e você só completou ${taskPercent}% do cronograma. Intensifique seus estudos!`,
      severity: "red",
    });
  }

  if (warnings.length === 0) return null;

  const severityStyles = {
    red: "border-destructive/50 bg-destructive/5 text-destructive",
    orange: "border-orange-500/50 bg-orange-500/5 text-orange-700 dark:text-orange-400",
  };

  return (
    <div className="space-y-3">
      {warnings.map((w, i) => (
        <Alert key={i} className={`${severityStyles[w.severity]} animate-fade-in`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">{w.title}</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{w.message}</span>
            {w.action && (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-xs h-7"
                onClick={() => navigate(w.action!.path)}
              >
                {w.action.label}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default DashboardWarnings;
