import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logErrorToBank } from "@/lib/errorBankLogger";
import {
  GraduationCap, Clock, FileText, CheckCircle, ArrowRight, ArrowLeft,
  Loader2, Trophy, AlertTriangle, Play, RotateCcw, BrainCircuit, Sparkles, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SimuladoResult {
  id: string;
  simulado_id: string;
  status: string;
  score: number | null;
  total_questions: number;
  answers_json: any[];
  started_at: string | null;
  finished_at: string | null;
}

interface Simulado {
  id: string;
  title: string;
  description: string | null;
  topics: string[];
  total_questions: number;
  time_limit_minutes: number;
  questions_json: any[];
  professor_id: string;
}

interface AssignedSimulado {
  result: SimuladoResult;
  simulado: Simulado;
}

type Phase = "list" | "quiz" | "result";

const StudentSimulados = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [assigned, setAssigned] = useState<AssignedSimulado[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("list");

  // Clinical cases (Plantão)
  const [clinicalCases, setClinicalCases] = useState<any[]>([]);
  const [clinicalLoading, setClinicalLoading] = useState(true);

  // Quiz state
  const [current, setCurrent] = useState<AssignedSimulado | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Result state
  const [resultData, setResultData] = useState<{ score: number; total: number; correct: number; details: any[] } | null>(null);

  const loadAssigned = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: results, error: rErr } = await supabase
        .from("teacher_simulado_results")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (rErr) throw rErr;
      if (!results || results.length === 0) {
        setAssigned([]);
        setLoading(false);
        return;
      }

      const simIds = [...new Set(results.map((r) => r.simulado_id))];
      const { data: simulados, error: sErr } = await supabase
        .from("teacher_simulados")
        .select("*")
        .in("id", simIds);

      if (sErr) throw sErr;

      const simMap = new Map((simulados || []).map((s) => [s.id, s]));
      const list: AssignedSimulado[] = results
        .map((r) => {
          const sim = simMap.get(r.simulado_id);
          if (!sim) return null;
          return {
            result: {
              ...r,
              answers_json: (r.answers_json as any[]) || [],
            } as SimuladoResult,
            simulado: {
              ...sim,
              questions_json: (sim.questions_json as any[]) || [],
            } as Simulado,
          };
        })
        .filter(Boolean) as AssignedSimulado[];

      setAssigned(list);
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível carregar simulados.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadAssigned();
  }, [loadAssigned]);

  // Timer
  useEffect(() => {
    if (phase !== "quiz" || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timeLeft > 0]);

  const startQuiz = async (item: AssignedSimulado) => {
    setCurrent(item);
    setQuestionIndex(0);
    const questions = item.simulado.questions_json || [];
    setAnswers(new Array(questions.length).fill(null));
    setTimeLeft(item.simulado.time_limit_minutes * 60);
    setPhase("quiz");

    if (item.result.status === "pending") {
      await supabase
        .from("teacher_simulado_results")
        .update({ status: "in_progress", started_at: new Date().toISOString() })
        .eq("id", item.result.id);
    }
  };

  const selectAnswer = (optionIndex: number) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[questionIndex] = optionIndex;
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    const questions = current.simulado.questions_json || [];
    let correct = 0;
    const details = questions.map((q: any, i: number) => {
      const isCorrect = answers[i] === q.correct_index;
      if (isCorrect) correct++;
      return {
        question_index: i,
        selected: answers[i],
        correct_index: q.correct_index,
        is_correct: isCorrect,
        topic: q.topic,
      };
    });

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    try {
      // Log wrong answers to error_bank
      for (const d of details) {
        if (!d.is_correct && d.selected !== null) {
          const q = questions[d.question_index];
          await logErrorToBank({
            userId: user!.id,
            tema: q.topic || "Geral",
            tipoQuestao: "simulado",
            conteudo: q.statement?.slice(0, 500) || "",
            motivoErro: `Marcou "${q.options?.[d.selected]}" — Correta: "${q.options?.[d.correct_index]}"`,
            categoriaErro: "conceito",
          });
        }
      }

      await supabase
        .from("teacher_simulado_results")
        .update({
          status: "completed",
          score,
          answers_json: details,
          finished_at: new Date().toISOString(),
        })
        .eq("id", current.result.id);

      setResultData({ score, total: questions.length, correct, details });
      setPhase("result");
      toast({ title: "Simulado concluído!", description: `Sua nota: ${score}%` });
    } catch {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const backToList = () => {
    setPhase("list");
    setCurrent(null);
    setResultData(null);
    loadAssigned();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // ============ LIST VIEW ============
  if (phase === "list") {
    const pending = assigned.filter((a) => a.result.status !== "completed");
    const completed = assigned.filter((a) => a.result.status === "completed");

    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Proficiência — Simulados do Professor
          </h1>
          <p className="text-muted-foreground text-sm">Realize os simulados atribuídos pelo seu professor e acompanhe seu desempenho.</p>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : assigned.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum simulado atribuído</h3>
              <p className="text-sm text-muted-foreground">Quando seu professor criar um simulado para você, ele aparecerá aqui.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Pendentes ({pending.length})
                </h2>
                {pending.map((item) => (
                  <Card key={item.result.id} className="border-amber-500/30 hover:border-amber-500/60 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{item.simulado.title}</h3>
                        {item.simulado.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{item.simulado.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(item.simulado.topics || []).slice(0, 4).map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{item.simulado.total_questions} questões</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.simulado.time_limit_minutes} min</span>
                        </div>
                      </div>
                      <Button onClick={() => startQuiz(item)} className="gap-2 shrink-0">
                        <Play className="h-4 w-4" />
                        {item.result.status === "in_progress" ? "Continuar" : "Iniciar"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  Concluídos ({completed.length})
                </h2>
                {completed.map((item) => (
                  <Card key={item.result.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{item.simulado.title}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(item.simulado.topics || []).slice(0, 3).map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.result.finished_at ? new Date(item.result.finished_at).toLocaleDateString("pt-BR") : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-2xl font-bold ${
                          (item.result.score || 0) >= 70 ? "text-emerald-500" :
                          (item.result.score || 0) >= 50 ? "text-amber-500" : "text-destructive"
                        }`}>
                          {Math.round(item.result.score || 0)}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {((item.result.answers_json || []) as any[]).filter((a: any) => a.is_correct).length}/{item.simulado.total_questions} acertos
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ============ QUIZ VIEW ============
  if (phase === "quiz" && current) {
    const questions = current.simulado.questions_json || [];
    const q = questions[questionIndex];
    const answeredCount = answers.filter((a) => a !== null).length;
    const isLowTime = timeLeft < 60;

    return (
      <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">{current.simulado.title}</h2>
            <p className="text-xs text-muted-foreground">Questão {questionIndex + 1} de {questions.length}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${
            isLowTime ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground"
          }`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <Progress value={((questionIndex + 1) / questions.length) * 100} className="h-1.5" />

        {/* Block indicator */}
        {q?.block && (questionIndex === 0 || questions[questionIndex - 1]?.block !== q.block) && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
            <span className="text-sm font-semibold text-primary">📋 Bloco: {q.block}</span>
          </div>
        )}

        {/* Question */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-6">
              <Badge className="shrink-0 mt-0.5">{questionIndex + 1}</Badge>
              <div>
                <p className="text-sm font-medium leading-relaxed">{q?.statement}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  {q?.block && <Badge variant="secondary" className="text-[10px]">{q.block}</Badge>}
                  {q?.topic && q.topic !== q.block && <Badge variant="outline" className="text-[10px]">{q.topic}</Badge>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {(q?.options || []).map((opt: string, i: number) => {
                const selected = answers[questionIndex] === i;
                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(i)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                      selected
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:border-primary/40 hover:bg-secondary/50"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
            disabled={questionIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Anterior
          </Button>

          <p className="text-xs text-muted-foreground">{answeredCount}/{questions.length} respondidas</p>

          {questionIndex < questions.length - 1 ? (
            <Button onClick={() => setQuestionIndex((i) => i + 1)} className="gap-2">
              Próxima <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {submitting ? "Enviando..." : "Finalizar"}
            </Button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex flex-wrap gap-1.5 justify-center pt-2">
          {questions.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setQuestionIndex(i)}
              className={`h-7 w-7 rounded-full text-[10px] font-bold border transition-colors ${
                i === questionIndex
                  ? "border-primary bg-primary text-primary-foreground"
                  : answers[i] !== null
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                  : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ============ RESULT VIEW ============
  if (phase === "result" && resultData && current) {
    const { score, total, correct, details } = resultData;
    const questions = current.simulado.questions_json || [];

    // Group by topic
    const byTopic: Record<string, { total: number; correct: number }> = {};
    details.forEach((d) => {
      const t = d.topic || "Geral";
      if (!byTopic[t]) byTopic[t] = { total: 0, correct: 0 };
      byTopic[t].total++;
      if (d.is_correct) byTopic[t].correct++;
    });

    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        {/* Score header */}
        <Card className="overflow-hidden">
          <div className={`p-8 text-center ${
            score >= 70 ? "bg-emerald-500/10" : score >= 50 ? "bg-amber-500/10" : "bg-destructive/10"
          }`}>
            <Trophy className={`h-12 w-12 mx-auto mb-3 ${
              score >= 70 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-destructive"
            }`} />
            <p className={`text-5xl font-bold ${
              score >= 70 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-destructive"
            }`}>
              {score}%
            </p>
            <p className="text-muted-foreground mt-2">{correct} de {total} questões corretas</p>
            <h3 className="font-semibold text-lg mt-1">{current.simulado.title}</h3>
          </div>
        </Card>

        {/* By topic */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desempenho por Tema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(byTopic).map(([topic, data]) => {
              const pct = Math.round((data.correct / data.total) * 100);
              return (
                <div key={topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{topic}</span>
                    <span className={`font-bold ${pct >= 70 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-destructive"}`}>
                      {data.correct}/{data.total} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Question review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revisão das Questões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {details.map((d, i) => {
              const q = questions[i];
              return (
                <div key={i} className={`p-4 rounded-lg border ${d.is_correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <Badge variant={d.is_correct ? "default" : "destructive"} className="shrink-0 text-[10px]">
                      {d.is_correct ? "✓" : "✗"} Q{i + 1}
                    </Badge>
                    <p className="text-sm">{q?.statement}</p>
                  </div>
                  {!d.is_correct && (
                    <div className="ml-8 space-y-1 text-xs">
                      <p className="text-destructive">Sua resposta: {q?.options?.[d.selected] || "Não respondida"}</p>
                      <p className="text-emerald-600">Correta: {q?.options?.[d.correct_index]}</p>
                      {q?.explanation && <p className="text-muted-foreground mt-1 italic">{q.explanation}</p>}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 gap-1 text-primary h-7 px-2"
                        onClick={() => {
                          const msg = `Errei esta questão de ${d.topic || "Geral"}:\n\n"${q?.statement?.slice(0, 400)}"\n\nMarquei: "${q?.options?.[d.selected] || "Não respondida"}"\nCorreta: "${q?.options?.[d.correct_index]}"\n\nExplique detalhadamente por que a alternativa correta é a certa e por que a minha está errada.`;
                          navigate("/dashboard/chatgpt", {
                            state: { fromSimulado: true, initialMessage: msg }
                          });
                        }}
                      >
                        <Sparkles className="h-3 w-3" />
                        Estudar com Tutor IA
                      </Button>
                    </div>
                  )}
                  {d.is_correct && q?.explanation && (
                    <p className="ml-8 text-xs text-muted-foreground italic">{q.explanation}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-3">
          {details.some(d => !d.is_correct) && (
            <Button
              onClick={() => {
                const errors = details
                  .filter(d => !d.is_correct)
                  .map((d, idx) => {
                    const q = questions[d.question_index];
                    return {
                      topic: d.topic || "Geral",
                      statement: q?.statement?.slice(0, 300) || "",
                      selectedAnswer: q?.options?.[d.selected] || "Não respondida",
                      correctAnswer: q?.options?.[d.correct_index] || "",
                    };
                  });
                const topics = [...new Set(errors.map(e => e.topic))];
                const msg = `Acabei de fazer o simulado "${current.simulado.title}" e errei ${errors.length} questão(ões). Os temas foram: ${topics.join(", ")}.\n\n${errors.map((e, i) => `❌ Q${i+1} (${e.topic}): ${e.statement.slice(0, 150)}...\nMarquei: "${e.selectedAnswer}" — Correta: "${e.correctAnswer}"`).join("\n\n")}\n\nMe ajude a revisar cada erro com explicações detalhadas.`;
                navigate("/dashboard/chatgpt", {
                  state: { fromSimulado: true, initialMessage: msg }
                });
              }}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              size="lg"
            >
              <BrainCircuit className="h-5 w-5" />
              Revisar Erros com Tutor IA
            </Button>
          )}
          <Button onClick={backToList} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" /> Voltar aos Simulados
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default StudentSimulados;
