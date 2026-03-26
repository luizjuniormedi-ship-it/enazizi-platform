import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  onComplete?: () => void;
}

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

const PomodoroTimer = ({ open, onOpenChange, topic, onComplete }: Props) => {
  const [seconds, setSeconds] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!running) { clearTimer(); return; }
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearTimer();
          setRunning(false);
          if (!isBreak) {
            setIsBreak(true);
            onComplete?.();
            return BREAK_SECONDS;
          } else {
            setIsBreak(false);
            return WORK_SECONDS;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [running, isBreak, clearTimer, onComplete]);

  useEffect(() => {
    if (!open) { clearTimer(); setRunning(false); setSeconds(WORK_SECONDS); setIsBreak(false); }
  }, [open, clearTimer]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const total = isBreak ? BREAK_SECONDS : WORK_SECONDS;
  const pct = ((total - seconds) / total) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBreak ? <Coffee className="h-5 w-5 text-green-500" /> : <Brain className="h-5 w-5 text-primary" />}
            {isBreak ? "Pausa" : "Modo Foco"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <p className="text-sm text-muted-foreground text-center">
            {isBreak ? "Descanse um pouco antes de continuar" : topic}
          </p>

          {/* Circular progress */}
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" strokeWidth="6" className="stroke-secondary" />
              <circle
                cx="60" cy="60" r="54" fill="none" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
                strokeLinecap="round"
                className={`transition-all duration-1000 ${isBreak ? "stroke-green-500" : "stroke-primary"}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-mono font-bold">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {isBreak ? "pausa" : "foco"}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setSeconds(isBreak ? BREAK_SECONDS : WORK_SECONDS); setRunning(false); }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              className="gap-2 px-8"
              onClick={() => setRunning(!running)}
            >
              {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {running ? "Pausar" : "Iniciar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PomodoroTimer;
