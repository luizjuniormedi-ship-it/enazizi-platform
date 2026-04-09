import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, ArrowRight, ArrowLeft, Flag, Bookmark, GraduationCap, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SimuladoMode } from "./SimuladoSetup";
import ImageQuestionViewer from "./ImageQuestion";
import { isImageUrlClinical } from "@/lib/multimodalSafetyGate";

export interface SimQuestion {
  statement: string;
  options: string[];
  correct: number;
  topic: string;
  explanation?: string;
  bankId?: string;
  source?: string;
  image_url?: string;
  image_type?: string;
  _isImageQuestion?: boolean;
  _imageQuestionId?: string;
}

interface SimuladoExamProps {
  questions: SimQuestion[];
  timeSeconds: number;
  onFinish: (answers: Record<number, number>, flagged: number[]) => void;
  onAutoSaveState: () => { current: number; selectedAnswers: Record<number, number>; timeLeft: number };
  onStateChange?: (state: { current: number; selectedAnswers: Record<number, number>; timeLeft: number; flaggedQuestions: number[]; revealedQuestions: number[] }) => void;
  initialState?: { current?: number; selectedAnswers?: Record<number, number>; timeLeft?: number; flaggedQuestions?: number[]; revealedQuestions?: number[] };
  mode: SimuladoMode;
}

const SimuladoExam = ({ questions, timeSeconds, onFinish, initialState, mode, onStateChange }: SimuladoExamProps) => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(initialState?.current ?? 0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(initialState?.selectedAnswers ?? {});
  const [timeLeft, setTimeLeft] = useState(initialState?.timeLeft ?? timeSeconds);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set(initialState?.flaggedQuestions ?? []));
  const [revealedQuestions, setRevealedQuestions] = useState<Set<number>>(new Set(initialState?.revealedQuestions ?? []));
  const timerRef = useRef<NodeJS.Timeout>();

  // Refs to avoid stale closures in timer
  const selectedAnswersRef = useRef(selectedAnswers);
  const flaggedQuestionsRef = useRef(flaggedQuestions);
  const onFinishRef = useRef(onFinish);
  const finishedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { selectedAnswersRef.current = selectedAnswers; }, [selectedAnswers]);
  useEffect(() => { flaggedQuestionsRef.current = flaggedQuestions; }, [flaggedQuestions]);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  // Report state changes to parent for auto-save
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);
  useEffect(() => {
    onStateChangeRef.current?.({
      current,
      selectedAnswers,
      timeLeft,
      flaggedQuestions: Array.from(flaggedQuestions),
      revealedQuestions: Array.from(revealedQuestions),
    });
  }, [current, selectedAnswers, timeLeft, flaggedQuestions, revealedQuestions]);

  const isStudyMode = mode === "estudo";

  // Timer - only in prova mode
  useEffect(() => {
    if (isStudyMode || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!finishedRef.current) {
            finishedRef.current = true;
            onFinishRef.current(selectedAnswersRef.current, Array.from(flaggedQuestionsRef.current));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isStudyMode]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const selectAnswer = (questionIdx: number, optionIdx: number) => {
    if (isStudyMode && revealedQuestions.has(questionIdx)) return;
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
    if (isStudyMode) {
      setRevealedQuestions(prev => new Set(prev).add(questionIdx));
    }
  };

  const toggleFlag = (idx: number) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleFinish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearInterval(timerRef.current);
    onFinishRef.current(selectedAnswersRef.current, Array.from(flaggedQuestionsRef.current));
  }, []);

  const handleStudyWithTutor = (q: SimQuestion) => {
    navigate("/dashboard/chatgpt", {
      state: {
        initialMessage: `Errei uma questão sobre "${q.topic}". O enunciado era: "${q.statement.slice(0, 200)}". A resposta correta era "${q.options[q.correct]}". Me explique este tema em detalhes seguindo o protocolo ENAZIZI.`,
        fromErrorBank: true,
      },
    });
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = questions.length - answeredCount;
  const timeWarning = !isStudyMode && timeLeft < 300;
  const q = questions[current];

  const correctCount = isStudyMode
    ? Object.entries(selectedAnswers).filter(([i]) => selectedAnswers[Number(i)] === questions[Number(i)]?.correct).length
    : 0;
  const wrongCount = isStudyMode ? answeredCount - correctCount : 0;

  if (!q) return null;

  const isRevealed = isStudyMode && revealedQuestions.has(current);
  const userAnswer = selectedAnswers[current];

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur py-2">
        <span className="text-sm font-medium">{current + 1}/{questions.length}</span>
        {isStudyMode ? (
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />{correctCount}</span>
            <span className="text-destructive flex items-center gap-1"><XCircle className="h-4 w-4" />{wrongCount}</span>
          </div>
        ) : (
          <span className={`flex items-center gap-1 text-sm font-mono font-bold ${timeWarning ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>
            <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{answeredCount}/{questions.length} respondidas</span>
      </div>

      {/* Progress */}
      <div className="h-1 rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {String(q.topic || "").replace(/\s*\(.*$/, "").trim() || q.topic}
            </span>
            {!isRevealed && userAnswer === undefined && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600">Não respondida</span>
            )}
          </div>
          <button
            onClick={() => toggleFlag(current)}
            className={`p-1.5 rounded-lg transition-all ${flaggedQuestions.has(current) ? "text-yellow-500 bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-500"}`}
            title="Marcar para revisão"
          >
            <Bookmark className={`h-5 w-5 ${flaggedQuestions.has(current) ? "fill-current" : ""}`} />
          </button>
        </div>
        {/* Imagem médica se disponível (ignora placeholders) */}
        {q.image_url && isImageUrlClinical(q.image_url) && (
          <div className="mb-4">
            <ImageQuestionViewer
              imageUrl={q.image_url}
              imageType={q.image_type}
              altText={`Imagem clínica - ${q.topic}`}
            />
          </div>
        )}
        {q._isImageQuestion && (!q.image_url || q.image_url.includes('placeholder')) && q.image_type && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              🖼️ {q.image_type === 'ecg' ? 'ECG' : q.image_type === 'xray' ? 'Raio-X' : q.image_type === 'dermatology' ? 'Dermatologia' : q.image_type === 'ct' ? 'Tomografia' : q.image_type.toUpperCase()}
            </span>
            <span className="text-xs text-muted-foreground">Questão baseada em imagem médica</span>
          </div>
        )}
        <p className="text-base font-medium mb-6">{q.statement}</p>
        <div className="space-y-3">
          {q.options.map((opt, i) => {
            let optionClass = "border-border bg-secondary/50 hover:border-primary/30";
            if (isRevealed) {
              if (i === q.correct) optionClass = "border-green-500 bg-green-500/10";
              else if (i === userAnswer) optionClass = "border-destructive bg-destructive/10";
              else optionClass = "border-border bg-secondary/30 opacity-60";
            } else if (userAnswer === i) {
              optionClass = "border-primary bg-primary/10";
            }

            return (
              <button
                key={i}
                onClick={() => selectAnswer(current, i)}
                disabled={isRevealed}
                className={`w-full text-left p-4 rounded-lg border text-sm transition-all ${optionClass} ${isRevealed ? "cursor-default" : ""}`}
              >
                <div className="flex items-center gap-2">
                  {isRevealed && i === q.correct && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  {isRevealed && i === userAnswer && i !== q.correct && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                  <span>
                    <span className="font-semibold mr-2">{String.fromCharCode(65 + i)})</span>
                    {opt.replace(/^[A-Ea-e]\)\s*/, '')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Study mode: explanation after answer */}
        {isRevealed && (
          <div className="mt-4 space-y-3 animate-fade-in">
            {q.explanation && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium mb-1 text-primary">📖 Explicação</p>
                <p className="text-sm text-muted-foreground">{q.explanation}</p>
              </div>
            )}
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleStudyWithTutor(q)}>
              <GraduationCap className="h-3.5 w-3.5" /> Aprofundar com Tutor IA
            </Button>
          </div>
        )}
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
          {questions.map((_, i) => {
            const isFlagged = flaggedQuestions.has(i);
            const isAnswered = selectedAnswers[i] !== undefined;
            const isCurrent = i === current;

            let bgClass = "bg-secondary text-muted-foreground";
            if (isCurrent) bgClass = "bg-primary text-primary-foreground";
            else if (isStudyMode && revealedQuestions.has(i)) {
              bgClass = selectedAnswers[i] === questions[i]?.correct
                ? "bg-green-500/20 text-green-700"
                : "bg-destructive/20 text-destructive";
            } else if (isAnswered) bgClass = "bg-primary/20 text-primary";

            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-7 w-7 rounded text-xs font-medium transition-all relative ${bgClass}`}
              >
                {i + 1}
                {isFlagged && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-yellow-500" />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" /> Marcada</span>
          {isStudyMode && (
            <>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Correta</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive inline-block" /> Errada</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimuladoExam;
