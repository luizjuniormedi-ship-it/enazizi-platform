import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Flame, Lock, CalendarX, ShieldAlert } from "lucide-react";
import type { AdaptiveState } from "@/hooks/useStudyEngine";

interface Props {
  adaptive?: AdaptiveState;
  streak?: number;
}

export default function MissionAlerts({ adaptive, streak }: Props) {
  if (!adaptive) return null;

  const alerts: React.ReactNode[] = [];

  if (adaptive.heavyRecovery?.active) {
    alerts.push(
      <div key="heavy" className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <Flame className="h-4 w-4" />
          Recuperação Pesada Ativa
          <Badge variant="destructive" className="ml-auto text-[10px]">
            Fase {adaptive.heavyRecovery.phase}/4
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {adaptive.heavyRecovery.phaseDescription || "Foque no essencial. O sistema está adaptando sua carga."}
        </p>
      </div>
    );
  } else if (adaptive.recoveryMode) {
    alerts.push(
      <div key="recovery" className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 space-y-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          Modo Recuperação Ativo
        </div>
        <p className="text-[11px] text-muted-foreground">
          {adaptive.recoveryReason || "Carga reduzida para estabilizar seu conhecimento."}
        </p>
      </div>
    );
  }

  if (adaptive.lockStatus?.locked) {
    alerts.push(
      <div key="lock" className="rounded-lg bg-secondary/60 border border-border p-3 flex items-center gap-2">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Conteúdo novo bloqueado — consolide a base primeiro.
        </p>
      </div>
    );
  }

  if (streak === 0) {
    alerts.push(
      <div key="streak" className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 flex items-center gap-2">
        <CalendarX className="h-4 w-4 text-amber-500" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Você está sem sequência de estudo. Hoje é dia de retomar!
        </p>
      </div>
    );
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts}
    </div>
  );
}
