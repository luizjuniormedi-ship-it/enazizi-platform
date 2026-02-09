import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface WarningProps {
  todayCompleted: number;
  todayTotal: number;
  completedTasks: number;
  totalTasks: number;
  streak: number;
  daysUntilExam: number | null;
}

interface Warning {
  title: string;
  message: string;
  severity: "red" | "orange";
}

const DashboardWarnings = ({ todayCompleted, todayTotal, completedTasks, totalTasks, streak, daysUntilExam }: WarningProps) => {
  const warnings: Warning[] = [];
  const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const hour = new Date().getHours();

  // No study today and it's past noon
  if (todayTotal > 0 && todayCompleted === 0 && hour >= 12) {
    warnings.push({
      title: "Você ainda não estudou hoje!",
      message: "O dia está passando e você não concluiu nenhum bloco do cronograma. Cada dia sem estudar é um dia mais longe do seu sonho. Bora começar agora!",
      severity: "red",
    });
  }

  // Low daily progress (completed < 50% and it's evening)
  if (todayTotal > 2 && todayCompleted > 0 && todayCompleted < todayTotal * 0.5 && hour >= 17) {
    warnings.push({
      title: "Seu progresso de hoje está baixo",
      message: `Você completou apenas ${todayCompleted} de ${todayTotal} blocos. O dia já está acabando — aproveite o tempo que resta!`,
      severity: "orange",
    });
  }

  // Overall task progress below 30%
  if (totalTasks > 5 && taskPercent < 30) {
    warnings.push({
      title: "Seu cronograma está ficando para trás!",
      message: `Apenas ${taskPercent}% das suas tarefas foram concluídas. Retome o foco agora!`,
      severity: "red",
    });
  }

  // Lost streak
  if (streak === 0 && totalTasks > 0) {
    warnings.push({
      title: "Sua sequência de estudos zerou!",
      message: "Você perdeu sua sequência de dias consecutivos. Grandes aprovações exigem constância. Comece uma nova sequência hoje mesmo!",
      severity: "orange",
    });
  }

  // Close to exam with low progress
  if (daysUntilExam !== null && daysUntilExam <= 30 && taskPercent < 50) {
    warnings.push({
      title: `⚠️ Faltam ${daysUntilExam} dias para a prova!`,
      message: `Restam ${daysUntilExam} dias e você só completou ${taskPercent}% do cronograma. Intensifique seus estudos agora!`,
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
          <AlertDescription>{w.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default DashboardWarnings;
