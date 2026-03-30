import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Timer, CheckCircle2, AlertTriangle, Lock } from "lucide-react";

interface FocusHardModeProps {
  taskTitle: string;
  taskType: string;
  estimatedMinutes: number;
  reason: string;
  onClose: () => void;
  onComplete: () => void;
  children: React.ReactNode;
}

export default function FocusHardMode({
  taskTitle,
  taskType,
  estimatedMinutes,
  reason,
  onClose,
  onComplete,
  children,
}: FocusHardModeProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    // Request fullscreen on mount
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      clearInterval(interval);
      document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const progressPct = Math.min((elapsed / (estimatedMinutes * 60)) * 100, 100);

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col">
      {/* Minimal header with warning */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-destructive/5">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-destructive" />
          <span className="text-xs font-bold text-destructive uppercase tracking-wider">
            Foco Extremo
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            — {reason}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onClose}>
            <X className="h-3.5 w-3.5 mr-1" />
            Sair
          </Button>
        </div>
      </div>

      <Progress value={progressPct} className="h-1 rounded-none" />

      {/* Single task - no navigation, no sidebar, no distractions */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-bold">{taskTitle}</h2>
          </div>
          {children}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-card/80 backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">
          {progressPct >= 100 ? "⏰ Tempo estimado atingido" : `${Math.round(progressPct)}% do tempo estimado`}
        </p>
        <Button size="sm" onClick={onComplete} className="gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
        </Button>
      </div>
    </div>
  );
}
