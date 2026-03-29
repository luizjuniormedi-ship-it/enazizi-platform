import { useStudyEngine } from "@/hooks/useStudyEngine";
import { Badge } from "@/components/ui/badge";
import { Lock, ShieldAlert, Zap } from "lucide-react";

const PHASE_COLORS: Record<string, string> = {
  critico: "bg-destructive/10 text-destructive border-destructive/30",
  atencao: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  competitivo: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  pronto: "bg-primary/10 text-primary border-primary/30",
};

const LOCK_ICONS: Record<string, React.ReactNode> = {
  blocked: <Lock className="h-3.5 w-3.5 text-destructive" />,
  limited: <ShieldAlert className="h-3.5 w-3.5 text-yellow-500" />,
  allowed: <Zap className="h-3.5 w-3.5 text-emerald-500" />,
};

const LOCK_LABELS: Record<string, string> = {
  blocked: "Revisão Prioritária",
  limited: "Modo Equilibrado",
  allowed: "Avanço Liberado",
};

export default function AdaptiveModeCard() {
  const { adaptive } = useStudyEngine();

  if (!adaptive) return null;

  const { mode, lockStatus, focusReason, memoryPressure } = adaptive;
  const colorClass = PHASE_COLORS[mode.phase] || PHASE_COLORS.atencao;

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${colorClass}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm">{mode.icon}</span>
        <span className="text-xs font-semibold flex-1">{focusReason}</span>
        <Badge variant="outline" className="text-[9px] h-4.5 gap-1 shrink-0">
          {LOCK_ICONS[lockStatus]}
          {LOCK_LABELS[lockStatus]}
        </Badge>
      </div>
    </div>
  );
}
