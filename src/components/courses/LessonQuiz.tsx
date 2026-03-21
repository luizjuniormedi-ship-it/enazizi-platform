import { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/data/ecgCourseData";

interface LessonQuizProps {
  questions: QuizQuestion[];
}

const LessonQuiz = ({ questions }: LessonQuizProps) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[currentQ];
  const isCorrect = selected === q.correctIndex;

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    setShowResult(true);
    if (isCorrect) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="glass-card p-6 text-center space-y-3">
        <div className="text-4xl">{pct >= 70 ? "🎉" : pct >= 50 ? "📚" : "💪"}</div>
        <h3 className="text-lg font-bold">Quiz concluído!</h3>
        <p className="text-2xl font-bold text-primary">{score}/{questions.length} ({pct}%)</p>
        <p className="text-sm text-muted-foreground">
          {pct >= 70 ? "Excelente! Você domina este conteúdo." : pct >= 50 ? "Bom resultado. Revise os pontos-chave." : "Revise a teoria e tente novamente!"}
        </p>
        <Button variant="outline" size="sm" onClick={() => { setCurrentQ(0); setSelected(null); setShowResult(false); setScore(0); setFinished(false); }}>
          Refazer quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4 border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-blue-500" />
          Quiz — Questão {currentQ + 1} de {questions.length}
        </h3>
        <span className="text-xs text-muted-foreground">{score} acerto(s)</span>
      </div>

      <p className="text-sm font-medium">{q.question}</p>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          let borderColor = "border-border hover:border-primary/50";
          if (showResult) {
            if (i === q.correctIndex) borderColor = "border-green-500 bg-green-500/10";
            else if (i === selected) borderColor = "border-red-500 bg-red-500/10";
          } else if (i === selected) {
            borderColor = "border-primary bg-primary/10";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={cn("w-full text-left p-3 rounded-lg border transition-all text-sm flex items-start gap-2", borderColor)}
            >
              <span className="font-bold text-xs mt-0.5 flex-shrink-0">{letter})</span>
              <span>{opt}</span>
              {showResult && i === q.correctIndex && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto flex-shrink-0 mt-0.5" />}
              {showResult && i === selected && i !== q.correctIndex && <XCircle className="h-4 w-4 text-red-500 ml-auto flex-shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className={cn("p-3 rounded-lg text-sm", isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-amber-500/10 border border-amber-500/30")}>
          <p className="font-semibold mb-1">{isCorrect ? "✅ Correto!" : "❌ Incorreto"}</p>
          <p className="text-muted-foreground">{q.explanation}</p>
        </div>
      )}

      <div className="flex justify-end">
        {!showResult ? (
          <Button size="sm" onClick={handleConfirm} disabled={selected === null}>Confirmar</Button>
        ) : (
          <Button size="sm" onClick={handleNext}>
            {currentQ < questions.length - 1 ? "Próxima questão" : "Ver resultado"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default LessonQuiz;
