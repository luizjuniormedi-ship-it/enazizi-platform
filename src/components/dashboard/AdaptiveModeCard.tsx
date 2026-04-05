import { useNavigate } from "react-router-dom";
import { useStudyEngine } from "@/hooks/useStudyEngine";
import { useMissionMode } from "@/hooks/useMissionMode";
import { Badge } from "@/components/ui/badge";
import { Lock, ShieldAlert, Zap, ChevronRight } from "lucide-react";

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

const LOCK_ACTIONS: Record<string, { label: string; path: string }> = {
  blocked: { label: "Revisar agora", path: "/dashboard/plano-dia" },
  limited: { label: "Ver plano", path: "/dashboard/plano-dia" },
  allowed: { label: "Avançar", path: "/mission" },
};

export default function AdaptiveModeCard() {
  const navigate = useNavigate();
  const { adaptive } = useStudyEngine();
  const { startMission } = useMissionMode();

  if (!adaptive) return null;

  const { mode, lockStatus, focusReason } = adaptive;
  const colorClass = PHASE_COLORS[mode.phase] || PHASE_COLORS.atencao;
  const action = LOCK_ACTIONS[lockStatus] || LOCK_ACTIONS.limited;

  const handleAction = () => {
    if (lockStatus === "allowed") {
      startMission();
    }
    navigate(action.path);
  };

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 cursor-pointer hover:opacity-90 transition-opacity ${colorClass}`}
      onClick={handleAction}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{mode.icon}</span>
        <span className="text-xs font-semibold flex-1">{focusReason}</span>
        <Badge variant="outline" className="text-[9px] h-4.5 gap-1 shrink-0">
          {LOCK_ICONS[lockStatus]}
          {LOCK_LABELS[lockStatus]}
        </Badge>
        <ChevronRight className="h-3.5 w-3.5 opacity-50 shrink-0" />
      </div>
    </div>
  );
}
