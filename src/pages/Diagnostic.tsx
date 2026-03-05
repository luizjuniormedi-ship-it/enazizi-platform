import { useState, useEffect } from "react";
import { Stethoscope, Clock, CheckCircle2, Loader2, ArrowRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DiagQuestion {
  statement: string;
  options: string[];
  correct_index: number;
  topic: string;
  explanation: string;
}

const AREAS = ["Clínica Médica", "Cirurgia", "Pediatria", "Ginecologia e Obstetrícia", "Medicina Preventiva"];

const Diagnostic = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"intro" | "loading" | "exam" | "result">("intro");
  const [questions, setQuestions] = useState<DiagQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<{ questionIdx: number; selected: number; correct: boolean; topic: string }[]>([]);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("diagnostic_results").select("id").eq("user_id", user.id).limit(1).then(({ data }) => {
      if (data && data.length > 0) setAlreadyDone(true);
    });
  }, [user]);

  const startExam = async () => {
    setPhase("loading");
    try {
      // Generate 25 questions (5 per area) via question generator
      const allQuestions: DiagQuestion[] = [];
      for (const area of AREAS) {
        const res = await supabase.functions.invoke("question-generator", {
          body: {
            messages: [{ role: "user", content: `Gere 5 questões de múltipla escolha de ${area} para simulado diagnóstico de residência médica. Nível intermediário. Formato: caso clínico curto + 5 alternativas.` }],
          },
        });
        if (res.error) throw res.error;
        // Parse from stream or direct response
        const content = typeof res.data === "string" ? res.data : res.data?.choices?.[0]?.message?.content || "";
        // Basic parser for questions
        const parsed = parseQuestions(content, area);
        allQuestions.push(...parsed.slice(0, 5));
      }

      if (allQuestions.length < 10) {
        // Fallback: generate all at once
        const res = await supabase.functions.invoke("question-generator", {
          body: {
            messages: [{ role: "user", content: `Gere 25 questões de múltipla escolha para simulado diagnóstico de residência médica, 5 de cada área: ${AREAS.join(", ")}. Formato JSON array: [{"statement":"...", "options":["a","b","c","d","e"], "correct_index": 0, "topic":"Área", "explanation":"..."}]` }],
          },
        });
        // Try to use whatever we got
      }

      setQuestions(allQuestions.length > 0 ? allQuestions : generateFallbackQuestions());
      setPhase("exam");
    } catch (err: any) {
      toast({ title: "Erro ao gerar diagnóstico", description: err.message, variant: "destructive" });
      setQuestions(generateFallbackQuestions());
      setPhase("exam");
    }
  };

  const parseQuestions = (text: string, defaultTopic: string): DiagQuestion[] => {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    // Fallback parsing
    return [];
  };

  const generateFallbackQuestions = (): DiagQuestion[] => {
    return AREAS.flatMap(area => [{
      statement: `Questão diagnóstica de ${area}: Paciente de 45 anos apresenta-se no pronto-socorro com queixa de dor torácica há 2 horas. Qual a conduta inicial mais adequada?`,
      options: ["ECG em até 10 minutos", "Solicitar troponina e aguardar", "Prescrever analgésico", "Encaminhar para enfermaria", "Solicitar raio-X de tórax primeiro"],
      correct_index: 0,
      topic: area,
      explanation: "O ECG deve ser realizado em até 10 minutos da chegada do paciente com dor torácica para descartar IAM com supra de ST.",
    }]);
  };

  const handleAnswer = () => {
    if (selected === null) return;
    setAnswered(true);
    setAnswers(prev => [...prev, {
      questionIdx: current,
      selected,
      correct: selected === questions[current].correct_index,
      topic: questions[current].topic,
    }]);
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      finishExam();
    }
  };

  const finishExam = async () => {
    const correctCount = answers.filter(a => a.correct).length;
    const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

    // Area breakdown
    const areaResults: Record<string, { correct: number; total: number }> = {};
    for (const a of answers) {
      if (!areaResults[a.topic]) areaResults[a.topic] = { correct: 0, total: 0 };
      areaResults[a.topic].total++;
      if (a.correct) areaResults[a.topic].correct++;
    }

    if (user) {
      await supabase.from("diagnostic_results").insert({
        user_id: user.id,
        score,
        total_questions: questions.length,
        results_json: { answers, areaResults },
      });
      await supabase.from("profiles").update({ has_completed_diagnostic: true }).eq("user_id", user.id);
    }

    setPhase("result");
  };

  if (phase === "intro") {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Diagnóstico Inicial</h1>
          <p className="text-muted-foreground text-lg mb-2">
            {alreadyDone
              ? "Você já realizou o diagnóstico. Deseja refazer?"
              : "Antes de começar, precisamos avaliar seu nível atual."}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            25 questões • 5 áreas • ~30 minutos
          </p>
          <Button size="lg" onClick={startExam}>
            {alreadyDone ? "Refazer diagnóstico" : "Iniciar diagnóstico"} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Gerando questões diagnósticas...</p>
        <p className="text-xs text-muted-foreground mt-2">Isso pode levar até 1 minuto</p>
      </div>
    );
  }

  if (phase === "result") {
    const correctCount = answers.filter(a => a.correct).length;
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const areaResults: Record<string, { correct: number; total: number }> = {};
    for (const a of answers) {
      if (!areaResults[a.topic]) areaResults[a.topic] = { correct: 0, total: 0 };
      areaResults[a.topic].total++;
      if (a.correct) areaResults[a.topic].correct++;
    }

    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="text-center py-6">
          <Award className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Resultado do Diagnóstico</h1>
          <div className="text-5xl font-black text-primary">{score}%</div>
          <p className="text-muted-foreground mt-2">{correctCount} de {questions.length} questões corretas</p>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Desempenho por área</h3>
          <div className="space-y-3">
            {Object.entries(areaResults).map(([area, { correct, total }]) => {
              const pct = Math.round((correct / total) * 100);
              return (
                <div key={area}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{area}</span>
                    <span className="text-muted-foreground">{correct}/{total} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div className={`h-full rounded-full transition-all ${pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => navigate("/dashboard")} className="flex-1">Ir para o Dashboard</Button>
          <Button onClick={() => navigate("/dashboard/plano-dia")} variant="outline" className="flex-1">Ver Plano do Dia</Button>
        </div>
      </div>
    );
  }

  // Exam phase
  const q = questions[current];
  if (!q) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" /> Diagnóstico
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{q.topic}</span>
          <span className="text-sm text-muted-foreground">{current + 1}/{questions.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="glass-card p-6">
        <p className="text-base font-medium mb-6">{q.statement}</p>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !answered && setSelected(i)}
              className={`w-full text-left p-4 rounded-lg border text-sm transition-all ${
                answered && i === q.correct_index
                  ? "border-green-500 bg-green-500/10"
                  : answered && i === selected && i !== q.correct_index
                  ? "border-destructive bg-destructive/10"
                  : selected === i
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:border-primary/30"
              }`}
            >
              <span className="font-semibold mr-2">{String.fromCharCode(65 + i)})</span>
              {opt}
            </button>
          ))}
        </div>

        {answered && q.explanation && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm"><strong>Explicação:</strong> {q.explanation}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {!answered ? (
            <Button onClick={handleAnswer} disabled={selected === null}>Confirmar</Button>
          ) : (
            <Button onClick={nextQuestion}>
              {current < questions.length - 1 ? "Próxima" : "Finalizar"} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Diagnostic;
