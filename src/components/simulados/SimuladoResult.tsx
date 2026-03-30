import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, BarChart3, AlertTriangle, GraduationCap, RotateCcw, Bookmark, BookOpen, Loader2, TrendingUp, Clock, Skull, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { XP_REWARDS } from "@/hooks/useGamification";
import type { SimQuestion } from "./SimuladoExam";
import type { SimuladoMode } from "./SimuladoSetup";

interface SimuladoResultProps {
  questions: SimQuestion[];
  selectedAnswers: Record<number, number>;
  onNewSimulado: () => void;
  onRetryErrors: () => void;
  flaggedQuestions: number[];
  mode: SimuladoMode;
  elapsedSeconds?: number;
}

const SimuladoResult = ({ questions, selectedAnswers, onNewSimulado, onRetryErrors, flaggedQuestions, mode, elapsedSeconds }: SimuladoResultProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generatingGuide, setGeneratingGuide] = useState<string | null>(null);

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

  const flaggedItems = flaggedQuestions
    .filter(i => i < questions.length)
    .map(i => ({ q: questions[i], idx: i }));

  const avgTimePerQuestion = elapsedSeconds && totalAnswered > 0
    ? Math.round(elapsedSeconds / totalAnswered)
    : null;

  const getDiagnosis = (areaPct: number) => {
    if (areaPct >= 80) return { label: "Dominado", color: "text-green-500", bg: "bg-green-500" };
    if (areaPct >= 60) return { label: "Revisar", color: "text-yellow-600", bg: "bg-yellow-500" };
    return { label: "Crítico", color: "text-destructive", bg: "bg-destructive" };
  };

  const handleStudyWithTutor = (q: SimQuestion) => {
    navigate("/dashboard/chatgpt", {
      state: {
        initialMessage: `Errei uma questão sobre "${q.topic}". O enunciado era: "${q.statement.slice(0, 200)}". A resposta correta era "${q.options[q.correct]}". Me explique este tema em detalhes seguindo o protocolo ENAZIZI.`,
        fromErrorBank: true,
      },
    });
  };

  const handleGenerateGuide = async (area: string) => {
    setGeneratingGuide(area);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-study-guide`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: `Gere um guia de estudo focado em ${area} para residência médica. O aluno teve menos de 60% de acerto nessa área.` }],
          }),
        },
      );
      if (res.ok) {
        toast({ title: `Guia de ${area} gerado!`, description: "Acesse em Guias de Estudo." });
      } else {
        toast({ title: "Erro ao gerar guia", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao gerar guia", variant: "destructive" });
    } finally {
      setGeneratingGuide(null);
    }
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

        {/* Time stats */}
        {avgTimePerQuestion && (
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Tempo médio: <strong>{avgTimePerQuestion}s</strong> por questão</span>
            {avgTimePerQuestion < 30 && <span className="text-yellow-600 text-xs">(muito rápido)</span>}
            {avgTimePerQuestion > 300 && <span className="text-yellow-600 text-xs">(muito lento)</span>}
          </div>
        )}
      </div>

      {/* Area breakdown with diagnosis */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Desempenho por área
        </h3>
        <div className="space-y-4">
          {Object.entries(areaResults).map(([area, { correct, total }]) => {
            const areaPct = Math.round((correct / total) * 100);
            const diag = getDiagnosis(areaPct);
            return (
              <div key={area}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-medium">{area}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diag.color} ${diag.bg}/10`}>{diag.label}</span>
                    <span className="text-muted-foreground">{correct}/{total} ({areaPct}%)</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-secondary">
                  <div className={`h-full rounded-full transition-all ${areaPct >= 80 ? "bg-green-500" : areaPct >= 60 ? "bg-yellow-500" : "bg-destructive"}`} style={{ width: `${areaPct}%` }} />
                </div>
                {areaPct < 60 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs mt-1 text-destructive"
                    onClick={() => handleGenerateGuide(area)}
                    disabled={generatingGuide === area}
                  >
                    {generatingGuide === area ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
                    Gerar Guia de Estudo
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Flagged questions */}
      {flaggedItems.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-yellow-500" /> Questões Marcadas ({flaggedItems.length})
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {flaggedItems.map(({ q, idx }) => (
              <div key={idx} className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <p className="text-sm font-medium mb-1">{q.statement.slice(0, 200)}{q.statement.length > 200 ? "..." : ""}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedAnswers[idx] !== undefined ? (
                    <>Sua: <span className={selectedAnswers[idx] === q.correct ? "text-green-500 font-medium" : "text-destructive font-medium"}>{String.fromCharCode(65 + selectedAnswers[idx])}</span> • </>
                  ) : <span className="text-yellow-600">Não respondida • </span>}
                  Correta: <span className="text-green-500 font-medium">{String.fromCharCode(65 + q.correct)}</span>
                </p>
                <Button variant="outline" size="sm" className="gap-1.5 mt-1 text-xs" onClick={() => handleStudyWithTutor(q)}>
                  <GraduationCap className="h-3.5 w-3.5" /> Estudar com Tutor IA
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <p className="text-sm font-medium mb-2">{q.statement}</p>
                <p className="text-xs text-muted-foreground mb-1">
                  {selectedAnswers[idx] !== undefined ? (
                    <>Sua resposta: <span className="text-destructive font-medium">{String.fromCharCode(65 + selectedAnswers[idx])}) {q.options[selectedAnswers[idx]]}</span>{" • "}</>
                  ) : (
                    <span className="text-yellow-600 font-medium">Não respondida • </span>
                  )}
                  Correta: <span className="text-green-500 font-medium">{String.fromCharCode(65 + q.correct)}) {q.options[q.correct]}</span>
                </p>
                {q.explanation && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mt-2">
                    <p className="text-xs text-muted-foreground">{q.explanation}</p>
                  </div>
                )}
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
