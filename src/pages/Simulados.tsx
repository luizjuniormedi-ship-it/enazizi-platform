import { useState, useCallback, useEffect, useRef } from "react";
import { logErrorToBank } from "@/lib/errorBankLogger";
import { updateDomainMap } from "@/lib/updateDomainMap";
import { isMedicalQuestion } from "@/lib/medicalValidation";
import { parseQuestionsFromText } from "@/lib/parseQuestions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import SimuladoSetup from "@/components/simulados/SimuladoSetup";
import type { SimuladoMode } from "@/components/simulados/SimuladoSetup";
import SimuladoExam from "@/components/simulados/SimuladoExam";
import type { SimQuestion } from "@/components/simulados/SimuladoExam";
import SimuladoResult from "@/components/simulados/SimuladoResult";

type Phase = "setup" | "loading" | "exam" | "finished";

const BATCH_SIZE = 10;

async function generateBatch(
  topics: string[],
  count: number,
  difficulty: string,
  accessToken: string | undefined,
): Promise<SimQuestion[]> {
  const topicsStr = topics.join(", ");
  const difficultyInstruction = difficulty === "misto"
    ? "Mescle questões fáceis (30%), intermediárias (50%) e difíceis (20%)."
    : `Nível de dificuldade: ${difficulty}.`;

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/question-generator`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        stream: false,
        outputFormat: "json",
        difficulty,
        timeoutMs: 55000,
        messages: [{
          role: "user",
          content: `Gere exatamente ${count} questões de múltipla escolha para simulado de residência médica sobre: ${topicsStr}. ${difficultyInstruction} Distribua igualmente entre os temas solicitados. Com casos clínicos completos.`,
        }],
      }),
    },
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(errBody.error || `Erro ${res.status}`);
  }

  const json = await res.json();

  const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try {
      const parsed = JSON.parse(toolCall.function.arguments);
      if (Array.isArray(parsed.questions)) {
        return mapQuestions(parsed.questions, topics);
      }
    } catch { /* fall through */ }
  }

  const content = json.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return mapQuestions(JSON.parse(jsonMatch[0]), topics);
    } catch { /* fall through */ }
  }

  const parsed = parseQuestionsFromText(content);
  if (parsed.length > 0) {
    return parsed.map((q) => ({
      statement: q.statement,
      options: q.options,
      correct: q.correctIndex,
      topic: q.topic || topics[0],
      explanation: q.explanation,
    }));
  }

  return [];
}

function mapQuestions(arr: any[], topics: string[]): SimQuestion[] {
  return (Array.isArray(arr) ? arr : [])
    .map((q: any) => ({
      statement: String(q.statement || ""),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correct: Number.isInteger(q.correct_index) ? q.correct_index : 0,
      topic: String(q.topic || topics[0]),
      explanation: String(q.explanation || ""),
    }))
    .filter(
      (q) =>
        q.options.length >= 4 &&
        q.statement.length > 10 &&
        isMedicalQuestion({ statement: q.statement, topic: q.topic, options: q.options }),
    );
}

const Simulados = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addXp } = useGamification();

  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<SimQuestion[]>([]);
  const [finalAnswers, setFinalAnswers] = useState<Record<number, number>>({});
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [restoredState, setRestoredState] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [mode, setMode] = useState<SimuladoMode>("estudo");
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const startTimeRef = useRef<Date>();
  const elapsedSecondsRef = useRef<number>(0);

  const { pendingSession, checked, saveSession, completeSession, abandonSession, registerAutoSave, clearPending } = useSessionPersistence({ moduleKey: "simulados" });

  const examStateRef = useRef<any>(null);

  const getExamState = useCallback(() => {
    if (phase !== "exam") return {};
    return { phase, questions, selectedTopics, mode, examState: examStateRef.current };
  }, [phase, questions, selectedTopics, mode]);

  useEffect(() => {
    registerAutoSave(getExamState);
  }, [getExamState, registerAutoSave]);

  const handleResumeSession = useCallback(() => {
    if (!pendingSession?.session_data) return;
    const data = pendingSession.session_data as Record<string, any>;
    if (data.questions) setQuestions(data.questions);
    if (data.selectedTopics) setSelectedTopics(data.selectedTopics);
    if (data.mode) setMode(data.mode);
    if (data.examState) setRestoredState(data.examState);
    startTimeRef.current = new Date();
    setPhase("exam");
    clearPending();
  }, [pendingSession, clearPending]);

  const handleStart = async (config: { topics: string[]; count: number; difficulty: string; timePerQuestion: number; mode: SimuladoMode }) => {
    if (config.topics.length === 0) {
      toast({ title: "Selecione pelo menos um assunto", variant: "destructive" });
      return;
    }
    if (!config.count || config.count < 1 || config.count > 100) {
      toast({ title: "Número de questões inválido (1-100)", variant: "destructive" });
      return;
    }

    setSelectedTopics(config.topics);
    setMode(config.mode);
    setPhase("loading");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      let allQuestions: SimQuestion[] = [];

      if (config.count <= BATCH_SIZE) {
        setLoadingProgress("Gerando questões...");
        allQuestions = await generateBatch(config.topics, config.count, config.difficulty, accessToken);
        if (allQuestions.length === 0) {
          setLoadingProgress("Tentando novamente...");
          allQuestions = await generateBatch(config.topics, config.count, config.difficulty, accessToken);
        }
      } else {
        const batchCount = Math.ceil(config.count / BATCH_SIZE);
        const batchSizes = Array.from({ length: batchCount }, (_, i) => {
          const remaining = config.count - i * BATCH_SIZE;
          return Math.min(BATCH_SIZE, remaining);
        });

        setLoadingProgress(`Gerando ${batchCount} lotes...`);

        const results = await Promise.allSettled(
          batchSizes.map((size) => generateBatch(config.topics, size, config.difficulty, accessToken)),
        );

        for (const result of results) {
          if (result.status === "fulfilled") {
            allQuestions.push(...result.value);
          }
        }

        const failedCount = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.length === 0)).length;
        if (failedCount > 0 && allQuestions.length < config.count) {
          setLoadingProgress(`Recuperando ${failedCount} lotes...`);
          const retrySize = Math.min(config.count - allQuestions.length, BATCH_SIZE);
          try {
            const retry = await generateBatch(config.topics, retrySize, config.difficulty, accessToken);
            allQuestions.push(...retry);
          } catch { /* accept partial */ }
        }
      }

      if (allQuestions.length === 0) {
        toast({ title: "Erro ao gerar questões. Tente novamente.", variant: "destructive" });
        setPhase("setup");
        return;
      }

      const finalQuestions = allQuestions.slice(0, config.count);
      setQuestions(finalQuestions);
      const timeLeft = config.mode === "prova" ? config.count * config.timePerQuestion * 60 : 0;
      setRestoredState({ timeLeft });
      startTimeRef.current = new Date();
      setPhase("exam");
    } catch (err: any) {
      toast({ title: "Erro ao gerar simulado", description: err.message, variant: "destructive" });
      setPhase("setup");
    }
  };

  const handleFinish = async (answers: Record<number, number>, flagged: number[]) => {
    setFinalAnswers(answers);
    setFlaggedQuestions(flagged);

    if (startTimeRef.current) {
      elapsedSecondsRef.current = Math.round((Date.now() - startTimeRef.current.getTime()) / 1000);
    }

    if (user) {
      const areaResults: Record<string, { correct: number; total: number }> = {};
      let correctCount = 0;
      questions.forEach((q, i) => {
        if (!areaResults[q.topic]) areaResults[q.topic] = { correct: 0, total: 0 };
        areaResults[q.topic].total++;
        const isCorrect = answers[i] === q.correct;
        if (isCorrect) { areaResults[q.topic].correct++; correctCount++; }
      });

      const finalScore = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

      await supabase.from("exam_sessions").insert({
        user_id: user.id,
        title: `Simulado - ${selectedTopics.slice(0, 3).join(", ")}${selectedTopics.length > 3 ? "..." : ""}`,
        total_questions: questions.length,
        time_limit_minutes: Math.round(elapsedSecondsRef.current / 60),
        status: "finished",
        finished_at: new Date().toISOString(),
        answers_json: answers,
        results_json: areaResults,
        score: finalScore,
      });

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (answers[i] !== undefined && answers[i] !== q.correct) {
          await logErrorToBank({
            userId: user.id,
            tema: q.topic || "Clínica Médica",
            tipoQuestao: "simulado",
            conteudo: q.statement,
            motivoErro: `Marcou "${q.options[answers[i]]}" — Correta: "${q.options[q.correct]}"`,
            categoriaErro: "conceito",
          });
        }
      }

      await addXp(XP_REWARDS.simulado_completed);

      const domainEntries = questions.map((q, i) => ({
        topic: q.topic,
        correct: answers[i] === q.correct,
      }));
      await updateDomainMap(user.id, domainEntries);
    }

    await completeSession();
    setPhase("finished");
  };

  const handleRetryErrors = async (sessionIdOrVoid?: string) => {
    if (sessionIdOrVoid) {
      const { data } = await supabase
        .from("exam_sessions")
        .select("answers_json, results_json, score, total_questions")
        .eq("id", sessionIdOrVoid)
        .single();

      if (!data) {
        toast({ title: "Sessão não encontrada", variant: "destructive" });
        return;
      }
      toast({ title: "Funcionalidade em breve", description: "A revisão de erros do histórico estará disponível em breve.", variant: "default" });
      return;
    }

    const errorQuestions = questions.filter((q, i) => finalAnswers[i] !== q.correct);
    if (errorQuestions.length === 0) return;

    setQuestions(errorQuestions);
    setFinalAnswers({});
    setFlaggedQuestions([]);
    setRestoredState({ timeLeft: mode === "prova" ? errorQuestions.length * 3 * 60 : 0 });
    startTimeRef.current = new Date();
    setPhase("exam");
  };

  const handleNewSimulado = () => {
    setPhase("setup");
    setQuestions([]);
    setFinalAnswers({});
    setFlaggedQuestions([]);
    setRestoredState(null);
  };

  if (phase === "setup") {
    return (
      <SimuladoSetup
        onStart={handleStart}
        onResumeSession={handleResumeSession}
        onRetryErrors={handleRetryErrors}
        pendingSession={pendingSession}
        checkedSession={checked}
        userId={user?.id}
      />
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">{loadingProgress || "Gerando questões..."}</p>
        <p className="text-xs text-muted-foreground mt-2">Isso pode levar alguns segundos</p>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <SimuladoResult
        questions={questions}
        selectedAnswers={finalAnswers}
        onNewSimulado={handleNewSimulado}
        onRetryErrors={() => handleRetryErrors()}
        flaggedQuestions={flaggedQuestions}
        mode={mode}
        elapsedSeconds={elapsedSecondsRef.current}
      />
    );
  }

  return (
    <SimuladoExam
      questions={questions}
      timeSeconds={restoredState?.timeLeft ?? (mode === "prova" ? questions.length * 3 * 60 : 0)}
      onFinish={handleFinish}
      onAutoSaveState={() => ({ current: 0, selectedAnswers: {}, timeLeft: 0 })}
      initialState={restoredState ? {
        current: restoredState.current ?? 0,
        selectedAnswers: restoredState.selectedAnswers ?? {},
        timeLeft: restoredState.timeLeft,
      } : undefined}
      mode={mode}
    />
  );
};

export default Simulados;
