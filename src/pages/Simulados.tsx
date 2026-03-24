import { useState, useCallback, useEffect, useRef } from "react";
import { logErrorToBank } from "@/lib/errorBankLogger";
import { updateDomainMap } from "@/lib/updateDomainMap";
import { isMedicalQuestion } from "@/lib/medicalValidation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import SimuladoSetup from "@/components/simulados/SimuladoSetup";
import SimuladoExam from "@/components/simulados/SimuladoExam";
import type { SimQuestion } from "@/components/simulados/SimuladoExam";
import SimuladoResult from "@/components/simulados/SimuladoResult";

type Phase = "setup" | "loading" | "exam" | "finished";

const Simulados = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addXp } = useGamification();

  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<SimQuestion[]>([]);
  const [finalAnswers, setFinalAnswers] = useState<Record<number, number>>({});
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [restoredState, setRestoredState] = useState<any>(null);
  const startTimeRef = useRef<Date>();

  // Session persistence
  const { pendingSession, checked, saveSession, completeSession, abandonSession, registerAutoSave, clearPending } = useSessionPersistence({ moduleKey: "simulados" });

  const examStateRef = useRef<any>(null);

  const getExamState = useCallback(() => {
    if (phase !== "exam") return {};
    return { phase, questions, selectedTopics, examState: examStateRef.current };
  }, [phase, questions, selectedTopics]);

  useEffect(() => {
    registerAutoSave(getExamState);
  }, [getExamState, registerAutoSave]);

  const handleResumeSession = useCallback(() => {
    if (!pendingSession?.session_data) return;
    const data = pendingSession.session_data as Record<string, any>;
    if (data.questions) setQuestions(data.questions);
    if (data.selectedTopics) setSelectedTopics(data.selectedTopics);
    if (data.examState) setRestoredState(data.examState);
    startTimeRef.current = new Date();
    setPhase("exam");
    clearPending();
  }, [pendingSession, clearPending]);

  const handleStart = async (config: { topics: string[]; count: number; difficulty: string; timePerQuestion: number }) => {
    if (config.topics.length === 0) {
      toast({ title: "Selecione pelo menos um assunto", variant: "destructive" });
      return;
    }
    if (!config.count || config.count < 1 || config.count > 100) {
      toast({ title: "Número de questões inválido (1-100)", variant: "destructive" });
      return;
    }

    setSelectedTopics(config.topics);
    setPhase("loading");

    try {
      const topicsStr = config.topics.join(", ");
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const difficultyInstruction = config.difficulty === "misto"
        ? "Mescle questões fáceis (30%), intermediárias (50%) e difíceis (20%)."
        : `Nível de dificuldade: ${config.difficulty}.`;

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
            difficulty: config.difficulty,
            messages: [{
              role: "user",
              content: `Gere exatamente ${config.count} questões de múltipla escolha para simulado de residência médica sobre: ${topicsStr}. 
${difficultyInstruction}
Formato OBRIGATÓRIO: JSON array puro, sem markdown, sem texto extra.
[{"statement":"caso clínico...", "options":["a","b","c","d","e"], "correct_index": 0, "topic":"Área", "explanation":"explicação detalhada"}]
Distribua igualmente entre os temas solicitados. Com casos clínicos.`
            }],
          }),
        }
      );

      if (!res.ok) throw new Error("Erro ao conectar com o gerador de questões");

      let parsed: SimQuestion[] = [];
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        let fullText = "";
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              try {
                const p = JSON.parse(jsonStr);
                const content = p.choices?.[0]?.delta?.content || p.choices?.[0]?.message?.content;
                if (content) fullText += content;
              } catch {}
            }
          }
        }
        const match = fullText.match(/\[[\s\S]*\]/);
        if (match) parsed = mapQuestions(JSON.parse(match[0]), config.topics);
      } else {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content || JSON.stringify(json);
        const match = content.match(/\[[\s\S]*\]/);
        if (match) parsed = mapQuestions(JSON.parse(match[0]), config.topics);
      }

      if (parsed.length === 0) {
        toast({ title: "Erro ao gerar questões. Tente novamente.", variant: "destructive" });
        setPhase("setup");
        return;
      }

      const finalQuestions = parsed.slice(0, config.count);
      setQuestions(finalQuestions);
      setRestoredState({ timeLeft: config.count * config.timePerQuestion * 60 });
      startTimeRef.current = new Date();
      setPhase("exam");
    } catch (err: any) {
      toast({ title: "Erro ao gerar simulado", description: err.message, variant: "destructive" });
      setPhase("setup");
    }
  };

  const mapQuestions = (arr: any[], topics: string[]): SimQuestion[] =>
    (Array.isArray(arr) ? arr : []).map((q: any) => ({
      statement: String(q.statement || ""),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correct: Number.isInteger(q.correct_index) ? q.correct_index : 0,
      topic: String(q.topic || topics[0]),
      explanation: String(q.explanation || ""),
    })).filter((q) => q.options.length >= 4 && q.statement.length > 10 && isMedicalQuestion({ statement: q.statement, topic: q.topic, options: q.options }));

  const handleFinish = async (answers: Record<number, number>) => {
    setFinalAnswers(answers);

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
        time_limit_minutes: Math.round((new Date().getTime() - (startTimeRef.current?.getTime() || Date.now())) / 60000),
        status: "finished",
        finished_at: new Date().toISOString(),
        answers_json: answers,
        results_json: areaResults,
        score: finalScore,
      });

      // Log errors
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
    // If called from history with a session ID, load that session's data
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
      // For history-based retry, we don't have the original questions stored
      // Show a toast explaining this limitation
      toast({ title: "Funcionalidade em breve", description: "A revisão de erros do histórico estará disponível em breve. Use 'Refazer só os erros' na tela de resultado logo após finalizar.", variant: "default" });
      return;
    }

    // Retry from current result screen
    const errorQuestions = questions.filter((q, i) => finalAnswers[i] !== q.correct);
    if (errorQuestions.length === 0) return;

    setQuestions(errorQuestions);
    setFinalAnswers({});
    setRestoredState({ timeLeft: errorQuestions.length * 3 * 60 });
    startTimeRef.current = new Date();
    setPhase("exam");
  };

  const handleNewSimulado = () => {
    setPhase("setup");
    setQuestions([]);
    setFinalAnswers({});
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
        <p className="text-muted-foreground">Gerando questões...</p>
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
      />
    );
  }

  // Exam phase
  return (
    <SimuladoExam
      questions={questions}
      timeSeconds={restoredState?.timeLeft ?? questions.length * 3 * 60}
      onFinish={handleFinish}
      onAutoSaveState={() => ({ current: 0, selectedAnswers: {}, timeLeft: 0 })}
      initialState={restoredState ? {
        current: restoredState.current ?? 0,
        selectedAnswers: restoredState.selectedAnswers ?? {},
        timeLeft: restoredState.timeLeft,
      } : undefined}
    />
  );
};

export default Simulados;
