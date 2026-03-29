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
      title: "Você ainda não estudou hoje",
      message: "Que tal começar com uma sessão rápida? Mesmo 20 minutos fazem diferença.",
      severity: "orange",
      action: { label: "Começar agora", path: "/dashboard/simulados" },
    });
  }

  if (hasStudyPlan) {
    if (todayTotal > 2 && todayCompleted > 0 && todayCompleted < todayTotal * 0.5 && hour >= 17) {
      warnings.push({
        title: "Progresso de hoje abaixo do esperado",
        message: `Você completou ${todayCompleted} de ${todayTotal} blocos. Ainda dá tempo de avançar.`,
        severity: "orange",
      });
    }

    if (totalTasks > 5 && taskPercent < 30) {
      warnings.push({
        title: "Seu plano precisa de atenção",
        message: `Apenas ${taskPercent}% das tarefas concluídas. Retome o ritmo para não acumular.`,
        severity: "red",
        action: { label: "Ver Plano Geral", path: "/dashboard/planner" },
      });
    }
  }

  if (!hasStudyPlan && totalTasks === 0) {
    warnings.push({
      title: "Crie seu Plano Geral",
      message: "Com um plano definido, o sistema organiza suas revisões e acompanha seu progresso.",
      severity: "orange",
      action: { label: "Criar plano", path: "/dashboard/planner" },
    });
  }

  if (streak === 0 && questionsToday === 0 && hour >= 14) {
    warnings.push({
      title: "Sua sequência de estudos zerou",
      message: "Constância é o que diferencia quem passa. Comece uma nova sequência hoje.",
      severity: "orange",
      action: { label: "Começar agora", path: "/dashboard/chatgpt" },
    });
  }

  if (daysUntilExam !== null && daysUntilExam <= 30 && taskPercent < 50 && hasStudyPlan) {
    warnings.push({
      title: `Faltam ${daysUntilExam} dias para a prova`,
      message: `Progresso em ${taskPercent}%. Foque nas revisões e nos temas com mais peso.`,
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
