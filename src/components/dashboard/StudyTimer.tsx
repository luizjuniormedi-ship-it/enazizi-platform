import { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, Coffee, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type TimerMode = "custom" | "pomodoro-work" | "pomodoro-break";

const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;

const StudyTimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [mode, setMode] = useState<TimerMode>("custom");
  const [customMinutes, setCustomMinutes] = useState(30);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup interval
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer tick
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setShowAlert(true);
            // Play notification sound
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 800;
              gain.gain.value = 0.3;
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
              setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.value = 1000;
                gain2.gain.value = 0.3;
                osc2.start();
                osc2.stop(ctx.currentTime + 0.5);
              }, 600);
            } catch { /* silent */ }

            // Browser notification
            if (Notification.permission === "granted") {
              new Notification("⏰ ENAZIZI", {
                body: mode === "pomodoro-work"
                  ? "Hora de descansar! Faça uma pausa de 5 minutos. ☕"
                  : mode === "pomodoro-break"
                    ? "Hora de voltar a estudar! 📚"
                    : "Tempo esgotado! Hora de descansar. ☕",
              });
            }

            if (mode === "pomodoro-work") {
              setPomodoroCount((c) => c + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, mode]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const startCustomTimer = () => {
    const seconds = customMinutes * 60;
    setTimeLeft(seconds);
    setTotalTime(seconds);
    setMode("custom");
    setIsRunning(true);
  };

  const startPomodoro = () => {
    setTimeLeft(POMODORO_WORK);
    setTotalTime(POMODORO_WORK);
    setMode("pomodoro-work");
    setIsRunning(true);
  };

  const startPomodoroBreak = () => {
    setTimeLeft(POMODORO_BREAK);
    setTotalTime(POMODORO_BREAK);
    setMode("pomodoro-break");
    setIsRunning(true);
    setShowAlert(false);
  };

  const startNextPomodoro = () => {
    setTimeLeft(POMODORO_WORK);
    setTotalTime(POMODORO_WORK);
    setMode("pomodoro-work");
    setIsRunning(true);
    setShowAlert(false);
  };

  const togglePause = () => setIsRunning(!isRunning);

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setTotalTime(0);
    setMode("custom");
    setPomodoroCount(0);
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  // Request permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const isActive = isRunning || timeLeft > 0;

  return (
    <>
      {/* Sidebar Timer Widget */}
      <div className="mx-3 mb-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full ${
            isActive
              ? "bg-primary/15 text-primary border border-primary/20"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          }`}
        >
          <Timer className={`h-4 w-4 ${isRunning ? "animate-pulse" : ""}`} />
          {isActive ? (
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          ) : (
            <span>⏱️ Cronômetro</span>
          )}
        </button>

        {isOpen && (
          <div className="mt-2 p-3 rounded-lg bg-sidebar-accent/30 border border-sidebar-border space-y-3">
            {/* Progress ring */}
            {isActive && (
              <div className="flex justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-lg font-bold text-foreground">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {mode === "pomodoro-work" ? "Foco" : mode === "pomodoro-break" ? "Pausa" : "Timer"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Controls when active */}
            {isActive && (
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant={isRunning ? "secondary" : "default"}
                  onClick={togglePause}
                  className="gap-1 h-7 text-xs"
                >
                  {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {isRunning ? "Pausar" : "Retomar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={reset} className="gap-1 h-7 text-xs">
                  <RotateCcw className="h-3 w-3" />
                  Resetar
                </Button>
              </div>
            )}

            {/* Pomodoro counter */}
            {(mode === "pomodoro-work" || mode === "pomodoro-break" || pomodoroCount > 0) && (
              <div className="text-center text-xs text-muted-foreground">
                🍅 {pomodoroCount} pomodoro{pomodoroCount !== 1 ? "s" : ""} completo{pomodoroCount !== 1 ? "s" : ""}
              </div>
            )}

            {/* Setup when idle */}
            {!isActive && (
              <>
                {/* Custom timer */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-sidebar-foreground/80">Timer livre</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(Math.max(1, Math.min(180, Number(e.target.value))))}
                        className="w-full h-7 px-2 text-xs rounded-md border border-sidebar-border bg-sidebar text-sidebar-foreground text-center"
                      />
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                    <Button size="sm" onClick={startCustomTimer} className="gap-1 h-7 text-xs">
                      <Play className="h-3 w-3" />
                      Iniciar
                    </Button>
                  </div>
                  {/* Quick presets */}
                  <div className="flex gap-1">
                    {[15, 30, 45, 60].map((m) => (
                      <button
                        key={m}
                        onClick={() => setCustomMinutes(m)}
                        className={`flex-1 text-[10px] py-1 rounded-md border transition-colors ${
                          customMinutes === m
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-sidebar-border text-muted-foreground hover:bg-sidebar-accent/50"
                        }`}
                      >
                        {m}min
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-sidebar-border" />

                {/* Pomodoro */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-sidebar-foreground/80">🍅 Pomodoro</label>
                  <p className="text-[10px] text-muted-foreground">25 min foco + 5 min pausa</p>
                  <Button size="sm" variant="secondary" onClick={startPomodoro} className="gap-1 h-7 text-xs w-full">
                    <BookOpen className="h-3 w-3" />
                    Iniciar Pomodoro
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Alert Dialog */}
      <Dialog open={showAlert} onOpenChange={setShowAlert}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center justify-center gap-2">
              {mode === "pomodoro-work" ? (
                <>☕ Hora de descansar!</>
              ) : mode === "pomodoro-break" ? (
                <>📚 Hora de estudar!</>
              ) : (
                <>⏰ Tempo esgotado!</>
              )}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {mode === "pomodoro-work" ? (
                <>Você completou {pomodoroCount} pomodoro{pomodoroCount !== 1 ? "s" : ""}! Faça uma pausa de 5 minutos para recarregar. 🧠</>
              ) : mode === "pomodoro-break" ? (
                <>Pausa terminada! Vamos voltar com tudo? 💪</>
              ) : (
                <>Seu tempo de estudo acabou. Hora de fazer uma pausa e descansar a mente! 🧘</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-4">
            {mode === "pomodoro-work" && (
              <>
                <Button onClick={startPomodoroBreak} className="gap-2">
                  <Coffee className="h-4 w-4" />
                  Iniciar pausa de 5 min
                </Button>
                <Button variant="outline" onClick={() => { setShowAlert(false); reset(); }}>
                  Encerrar sessão
                </Button>
              </>
            )}
            {mode === "pomodoro-break" && (
              <>
                <Button onClick={startNextPomodoro} className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Próximo Pomodoro
                </Button>
                <Button variant="outline" onClick={() => { setShowAlert(false); reset(); }}>
                  Encerrar sessão
                </Button>
              </>
            )}
            {mode === "custom" && (
              <>
                <Button onClick={() => { setShowAlert(false); reset(); }} className="gap-2">
                  <Coffee className="h-4 w-4" />
                  Entendido, vou descansar!
                </Button>
                <Button variant="outline" onClick={() => { startCustomTimer(); setShowAlert(false); }}>
                  Reiniciar timer
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudyTimer;
