import { Clock, Trophy, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { fireCelebration } from "@/lib/celebrations";

interface Props {
  overallPct: number;
  totalDone: number;
  totalItems: number;
  totalMinutes?: number;
}

const DailyPlanProgress = ({ overallPct, totalDone, totalItems, totalMinutes }: Props) => {
  const celebrated = useRef(false);

  useEffect(() => {
    if (overallPct === 100 && totalItems > 0 && !celebrated.current) {
      celebrated.current = true;
      fireCelebration("goal");
    }
  }, [overallPct, totalItems]);

  const isComplete = overallPct === 100 && totalItems > 0;

  return (
    <div className={`glass-card p-4 transition-all ${isComplete ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : ""}`}>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="flex items-center gap-1.5">
              {isComplete && <Trophy className="h-4 w-4 text-primary animate-bounce" />}
              Progresso do Dia
            </span>
            <span className="font-bold text-primary">{overallPct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${isComplete ? "bg-gradient-to-r from-primary to-green-500" : "bg-primary"}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isComplete ? (
              <span className="text-primary font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Parabéns! Dia 100% concluído!
              </span>
            ) : (
              `${totalDone}/${totalItems} atividades concluídas`
            )}
          </p>
        </div>
        {totalMinutes != null && totalMinutes > 0 && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {Math.round(totalMinutes / 60)}h {totalMinutes % 60}min
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyPlanProgress;
