import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Timer, Maximize2, Minimize2, CheckCircle2, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusModeProps {
  taskTitle: string;
  taskType: string;
  estimatedMinutes: number;
  onClose: () => void;
  onComplete: () => void;
  onSkip: () => void;
  children: React.ReactNode;
}

export default function FocusMode({
  taskTitle,
  taskType,
  estimatedMinutes,
  onClose,
  onComplete,
  onSkip,
  children,
}: FocusModeProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const progressPct = Math.min((elapsed / (estimatedMinutes * 60)) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Modo Foco
          </div>
          <span className="text-sm font-semibold truncate">{taskTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-[10px]">/ {estimatedMinutes}min</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSkip}>
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progressPct} className="h-1 rounded-none" />

      {/* Content area — children slot */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-card/80 backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">
          {progressPct >= 100 ? "⏰ Tempo estimado atingido" : `${Math.round(progressPct)}% do tempo estimado`}
        </p>
        <Button size="sm" onClick={onComplete} className="gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> Concluir bloco
        </Button>
      </div>
    </div>
  );
}
