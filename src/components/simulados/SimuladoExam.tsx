import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Clock, ArrowRight, ArrowLeft, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SimQuestion {
  statement: string;
  options: string[];
  correct: number;
  topic: string;
  explanation?: string;
}

interface SimuladoExamProps {
  questions: SimQuestion[];
  timeSeconds: number;
  onFinish: (answers: Record<number, number>) => void;
  onAutoSaveState: () => { current: number; selectedAnswers: Record<number, number>; timeLeft: number };
  initialState?: { current?: number; selectedAnswers?: Record<number, number>; timeLeft?: number };
}

const SimuladoExam = ({ questions, timeSeconds, onFinish, initialState }: SimuladoExamProps) => {
  const [current, setCurrent] = useState(initialState?.current ?? 0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(initialState?.selectedAnswers ?? {});
  const [timeLeft, setTimeLeft] = useState(initialState?.timeLeft ?? timeSeconds);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onFinish(selectedAnswers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const selectAnswer = (questionIdx: number, optionIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleFinish = () => {
    clearInterval(timerRef.current);
    onFinish(selectedAnswers);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = questions.length - answeredCount;
  const timeWarning = timeLeft < 300;
  const q = questions[current];

  if (!q) return null;

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur py-2">
        <span className="text-sm font-medium">{current + 1}/{questions.length}</span>
        <span className={`flex items-center gap-1 text-sm font-mono font-bold ${timeWarning ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>
          <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
        </span>
        <span className="text-xs text-muted-foreground">{answeredCount}/{questions.length} respondidas</span>
      </div>

      {/* Progress */}
      <div className="h-1 rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{q.topic}</span>
          {selectedAnswers[current] === undefined && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600">Não respondida</span>
          )}
        </div>
        <p className="text-base font-medium mb-6">{q.statement}</p>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => selectAnswer(current, i)}
              className={`w-full text-left p-4 rounded-lg border text-sm transition-all ${
                selectedAnswers[current] === i ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-primary/30"
              }`}
            >
              <span className="font-semibold mr-2">{String.fromCharCode(65 + i)})</span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(c => c - 1)} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        {current < questions.length - 1 ? (
          <Button onClick={() => setCurrent(c => c + 1)} className="flex-1">
            Próxima <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => unansweredCount > 0 ? setShowConfirmFinish(true) : handleFinish()} variant="default" className="flex-1">
            <Flag className="h-4 w-4 mr-1" /> Finalizar
          </Button>
        )}
      </div>

      {/* Confirm finish dialog */}
      {showConfirmFinish && (
        <div className="glass-card p-4 border-yellow-500/30 bg-yellow-500/5">
          <p className="text-sm font-medium mb-2">⚠️ Você tem {unansweredCount} questões não respondidas.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={handleFinish}>Finalizar mesmo assim</Button>
            <Button size="sm" variant="outline" onClick={() => setShowConfirmFinish(false)}>Voltar ao simulado</Button>
          </div>
        </div>
      )}

      {/* Question grid */}
      <div className="glass-card p-3">
        <div className="flex flex-wrap gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-7 w-7 rounded text-xs font-medium transition-all ${
                i === current
                  ? "bg-primary text-primary-foreground"
                  : selectedAnswers[i] !== undefined
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimuladoExam;
