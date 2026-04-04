import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, Brain, Lock, Flame, CalendarX } from "lucide-react";
import type { AdaptiveState } from "@/hooks/useStudyEngine";

interface Props {
  adaptive?: AdaptiveState;
  streak?: number;
}

interface DiagnosticFactor {
  icon: React.ReactNode;
  label: string;
  severity: "high" | "medium";
}

function buildFactors(adaptive?: AdaptiveState, streak?: number): DiagnosticFactor[] {
  const factors: DiagnosticFactor[] = [];
  if (!adaptive) return factors;

  if (adaptive.heavyRecovery?.active) {
    factors.push({
      icon: <Flame className="h-4 w-4" />,
      label: `Recuperação Pesada ativa — Fase ${adaptive.heavyRecovery.phase}/4`,
      severity: "high",
    });
  } else if (adaptive.recoveryMode) {
    factors.push({
      icon: <AlertTriangle className="h-4 w-4" />,
      label: `Modo recuperação ativo — ${adaptive.recoveryReason || "backlog alto"}`,
      severity: "high",
    });
  }

  if (adaptive.overdueCount >= 10) {
    factors.push({
      icon: <Clock className="h-4 w-4" />,
      label: `${adaptive.overdueCount} revisões atrasadas`,
      severity: adaptive.overdueCount >= 20 ? "high" : "medium",
    });
  }

  if (adaptive.memoryPressure >= 70) {
    factors.push({
      icon: <Brain className="h-4 w-4" />,
      label: "Pressão de memória alta — risco de esquecimento",
      severity: "high",
    });
  }

  if (adaptive.lockStatus?.locked) {
    factors.push({
      icon: <Lock className="h-4 w-4" />,
      label: "Conteúdo bloqueado até consolidar a base",
      severity: "medium",
    });
  }

  if (streak !== undefined && streak === 0) {
    factors.push({
      icon: <CalendarX className="h-4 w-4" />,
      label: "Você ficou sem estudar — hora de retomar",
      severity: "medium",
    });
  }

  return factors.slice(0, 3);
}

export default function MissionDiagnosticCard({ adaptive, streak }: Props) {
  const factors = buildFactors(adaptive, streak);
  if (factors.length === 0) return null;

  return (
    <Card className="rounded-xl border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 space-y-2.5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          O que mais impacta sua evolução hoje
        </h3>
        <div className="space-y-2">
          {factors.map((f, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                f.severity === "high"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              }`}
            >
              {f.icon}
              {f.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
