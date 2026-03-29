import { useStudyEngine } from "@/hooks/useStudyEngine";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Lock, ShieldAlert, TrendingUp, Zap } from "lucide-react";

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
    <Card className={`${colorClass} border`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base">{mode.icon}</span>
          <span className="text-sm font-bold">{mode.label}</span>
          <Badge variant="outline" className="ml-auto text-[10px] h-5 gap-1">
            {LOCK_ICONS[lockStatus]}
            {LOCK_LABELS[lockStatus]}
          </Badge>
        </div>

        <p className="text-xs text-foreground/80 leading-relaxed mb-2">
          {focusReason}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {mode.focusAreas.map((area) => (
            <Badge key={area} variant="secondary" className="text-[10px] font-normal">
              {area}
            </Badge>
          ))}
        </div>

        {memoryPressure > 50 && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info className="h-3 w-3" />
            Pressão de memória: {Math.round(memoryPressure)}% — revisões são prioridade.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
