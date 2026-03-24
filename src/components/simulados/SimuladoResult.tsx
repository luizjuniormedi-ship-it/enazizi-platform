import { useNavigate } from "react-router-dom";
import { Award, BarChart3, AlertTriangle, GraduationCap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { XP_REWARDS } from "@/hooks/useGamification";
import type { SimQuestion } from "./SimuladoExam";

interface SimuladoResultProps {
  questions: SimQuestion[];
  selectedAnswers: Record<number, number>;
  onNewSimulado: () => void;
  onRetryErrors: () => void;
}

const SimuladoResult = ({ questions, selectedAnswers, onNewSimulado, onRetryErrors }: SimuladoResultProps) => {
  const navigate = useNavigate();

  const correctCount = questions.reduce((acc, q, i) => acc + (selectedAnswers[i] === q.correct ? 1 : 0), 0);
  const totalAnswered = Object.keys(selectedAnswers).length;
  const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const areaResults: Record<string, { correct: number; total: number }> = {};
  const errorQuestions: { q: SimQuestion; idx: number }[] = [];

  questions.forEach((q, i) => {
    if (!areaResults[q.topic]) areaResults[q.topic] = { correct: 0, total: 0 };
    areaResults[q.topic].total++;
    if (selectedAnswers[i] === q.correct) {
      areaResults[q.topic].correct++;
    } else {
      errorQuestions.push({ q, idx: i });
    }
  });

  const handleStudyWithTutor = (q: SimQuestion) => {
    navigate("/dashboard/chatgpt", {
      state: {
        initialMessage: `Errei uma questão sobre "${q.topic}". O enunciado era: "${q.statement.slice(0, 200)}". A resposta correta era "${q.options[q.correct]}". Me explique este tema em detalhes seguindo o protocolo MedStudy.`,
        fromErrorBank: true,
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="text-center py-6">
        <Award className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Simulado Concluído!</h1>
        <div className="text-5xl font-black text-primary">{pct}%</div>
        <p className="text-muted-foreground mt-2">{correctCount} de {questions.length} questões corretas</p>
        {totalAnswered < questions.length && (
          <p className="text-xs text-yellow-600 mt-1">{questions.length - totalAnswered} questões não respondidas</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">+{XP_REWARDS.simulado_completed} XP ganhos 🎉</p>
      </div>

      {/* Area breakdown */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Desempenho por área
        </h3>
        <div className="space-y-3">
          {Object.entries(areaResults).map(([area, { correct, total }]) => {
            const areaPct = Math.round((correct / total) * 100);
            return (
              <div key={area}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{area}</span>
                  <span className="text-muted-foreground">{correct}/{total} ({areaPct}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary">
                  <div className={`h-full rounded-full transition-all ${areaPct >= 70 ? "bg-green-500" : areaPct >= 50 ? "bg-yellow-500" : "bg-destructive"}`} style={{ width: `${areaPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error notebook */}
      {errorQuestions.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Caderno de Erros ({errorQuestions.length})
            </h3>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onRetryErrors}>
              <RotateCcw className="h-3.5 w-3.5" /> Refazer só os erros
            </Button>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {errorQuestions.map(({ q, idx }) => (
              <div key={idx} className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-sm font-medium mb-2">{q.statement.slice(0, 300)}{q.statement.length > 300 ? "..." : ""}</p>
                <p className="text-xs text-muted-foreground mb-1">
                  {selectedAnswers[idx] !== undefined ? (
                    <>Sua resposta: <span className="text-destructive font-medium">{String.fromCharCode(65 + selectedAnswers[idx])}</span>{" • "}</>
                  ) : (
                    <span className="text-yellow-600 font-medium">Não respondida • </span>
                  )}
                  Correta: <span className="text-green-500 font-medium">{String.fromCharCode(65 + q.correct)}</span>
                </p>
                {q.explanation && <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>}
                <Button variant="outline" size="sm" className="gap-1.5 mt-2 text-xs" onClick={() => handleStudyWithTutor(q)}>
                  <GraduationCap className="h-3.5 w-3.5" /> Estudar com Tutor IA
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center flex-wrap">
        <Button onClick={onNewSimulado}>Novo Simulado</Button>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
      </div>
    </div>
  );
};

export default SimuladoResult;
