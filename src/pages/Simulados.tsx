import { useState, useCallback, useEffect, useRef } from "react";
import { logErrorToBank } from "@/lib/errorBankLogger";
import { updateDomainMap } from "@/lib/updateDomainMap";
import { NON_MEDICAL_CONTENT_REGEX } from "@/lib/medicalValidation";
import { parseQuestionsFromText } from "@/lib/parseQuestions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

function getSourcePriority(source: string | null | undefined): number {
  if (!source) return 3;
  if (source === "web-scrape" || source === "real-exam-ai") return 1;
  if (source === "ai-exam-style") return 2;
  return 3;
}
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import SimuladoSetup from "@/components/simulados/SimuladoSetup";
import type { SimuladoMode } from "@/components/simulados/SimuladoSetup";
import SimuladoExam from "@/components/simulados/SimuladoExam";
import type { SimQuestion } from "@/components/simulados/SimuladoExam";
import SimuladoResult from "@/components/simulados/SimuladoResult";

type Phase = "setup" | "loading" | "exam" | "finished" | "partial";

const BATCH_SIZE = 10;

function buildPrompt(topics: string[], count: number, difficulty: string): string {
  const topicsStr = topics.join(", ");
  const perTopic = Math.ceil(count / topics.length);
  const difficultyInstruction = difficulty === "misto"
    ? "Distribua: 50% intermediárias (padrão REVALIDA) e 50% difíceis (padrão ENAMED/ENARE)."
    : `Nível de dificuldade: ${difficulty}.`;

  return `Gere exatamente ${count} questões de múltipla escolha para simulado de residência médica.

IDIOMA OBRIGATÓRIO: TUDO deve ser escrito em PORTUGUÊS BRASILEIRO. Enunciados, alternativas, explicações — TUDO em pt-BR. NUNCA use inglês.

TEMAS: ${topicsStr}
DISTRIBUIÇÃO: aproximadamente ${perTopic} questões por tema. Distribua igualmente.
${difficultyInstruction}

REGRAS OBRIGATÓRIAS:
1. Cada questão DEVE ser um caso clínico completo com: idade, sexo, queixa principal, história clínica relevante, exame físico e/ou exames complementares
2. Mínimo 150 caracteres no enunciado
3. Exatamente 5 alternativas (A-E) por questão
4. A explicação deve citar a referência bibliográfica (ex: Harrison, Nelson, Sabiston, etc.)
5. O campo "correct_index" deve ser o índice (0-4) da alternativa correta
6. 70% das questões devem envolver raciocínio clínico (diagnóstico, conduta ou tratamento), 30% podem ser teóricas
7. TODOS os textos DEVEM estar em português brasileiro. PROIBIDO qualquer texto em inglês.

FORMATO: Retorne APENAS um array JSON puro, sem markdown, sem \`\`\`, neste formato:
[
  {
    "statement": "Caso clínico completo em português...",
    "options": ["alternativa A em português", "alternativa B em português", "alternativa C em português", "alternativa D em português", "alternativa E em português"],
    "correct_index": 0,
    "topic": "tema da questão em português",
    "explanation": "Explicação detalhada em português com referência bibliográfica..."
  }
]`;
}

async function generateBatch(
  topics: string[],
  count: number,
  difficulty: string,
  accessToken: string | undefined,
): Promise<SimQuestion[]> {
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
        messages: [{ role: "user", content: buildPrompt(topics, count, difficulty) }],
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
      if (Array.isArray(parsed.questions)) return mapQuestions(parsed.questions, topics);
    } catch { /* fall through */ }
  }

  const content = json.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try { return mapQuestions(JSON.parse(jsonMatch[0]), topics); } catch { /* fall through */ }
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
    .map((q: any) => {
      const options = Array.isArray(q.options) ? q.options.map(String) : [];
      const correctIdx = Number.isInteger(q.correct_index) ? q.correct_index : 0;
      return {
        statement: String(q.statement || ""),
        options,
        correct: correctIdx >= 0 && correctIdx < options.length ? correctIdx : 0,
        topic: String(q.topic || topics[0]),
        explanation: String(q.explanation || ""),
      };
    })
    .filter(
      (q) =>
        q.options.length >= 4 &&
        q.statement.length > 10 &&
        !NON_MEDICAL_CONTENT_REGEX.test(q.statement),
    );
}

function deduplicateQuestions(questions: SimQuestion[]): SimQuestion[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    const key = q.statement.substring(0, 80).toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [mode, setMode] = useState<SimuladoMode>("estudo");
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [partialCount, setPartialCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const startTimeRef = useRef<Date>();
  const elapsedSecondsRef = useRef<number>(0);
  const configRef = useRef<any>(null);

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

  const startExamWithQuestions = (qs: SimQuestion[], config: any) => {
    setQuestions(qs);
    const isTimedMode = config.mode === "prova" || config.mode === "extremo";
    const timeLeft = isTimedMode ? qs.length * config.timePerQuestion * 60 : 0;
    setRestoredState({ timeLeft });
    startTimeRef.current = new Date();
    setPhase("exam");
  };

  const handleAcceptPartial = () => {
    if (questions.length > 0) {
      startExamWithQuestions(questions, configRef.current);
    }
  };

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
    setTargetCount(config.count);
    configRef.current = config;
    setPhase("loading");
    setLoadingPercent(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // ── Step 1: Fetch previously answered question IDs ──
      setLoadingProgress("Verificando questões já respondidas...");
      const { data: pastAttempts } = await supabase
        .from("practice_attempts")
        .select("question_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      const answeredIds = new Set((pastAttempts || []).map((a) => a.question_id));

      // ── Step 2: Fetch questions from bank matching topics ──
      setLoadingProgress("Buscando questões do banco...");
      setLoadingPercent(10);

      const topicFilters = config.topics.map((t) => `topic.ilike.%${t}%`).join(",");
      const { data: bankData } = await supabase
        .from("questions_bank")
        .select("id, statement, options, correct_index, topic, explanation, source")
        .or(topicFilters)
        .eq("review_status", "approved")
        .limit(500);

      const bankQuestions: SimQuestion[] = (bankData || [])
        .filter((q: any) => !answeredIds.has(q.id))
        .map((q: any) => ({
          statement: String(q.statement || ""),
          options: Array.isArray(q.options) ? q.options.map(String) : [],
          correct: Number.isInteger(q.correct_index) ? q.correct_index : 0,
          topic: String(q.topic || config.topics[0]),
          explanation: String(q.explanation || ""),
          bankId: q.id,
          source: q.source || null,
        }))
        .filter(
          (q) =>
            q.options.length >= 4 &&
            q.statement.length > 10 &&
            !NON_MEDICAL_CONTENT_REGEX.test(q.statement),
        )
        .sort((a, b) => {
          const priorityDiff = getSourcePriority(a.source) - getSourcePriority(b.source);
          return priorityDiff !== 0 ? priorityDiff : Math.random() - 0.5;
        });

      setLoadingPercent(25);
      const bankCount = Math.min(bankQuestions.length, config.count);
      const selectedFromBank = bankQuestions.slice(0, bankCount);
      const deficit = config.count - selectedFromBank.length;

      setLoadingProgress(`${selectedFromBank.length} questões do banco. ${deficit > 0 ? `Gerando ${deficit} via IA...` : "Pronto!"}`);

      // ── Step 3: Generate remaining via AI if needed ──
      let allQuestions: SimQuestion[] = [...selectedFromBank];

      if (deficit > 0) {
        const requestCount = Math.ceil(deficit * 1.3);

        if (requestCount <= BATCH_SIZE) {
          setLoadingPercent(40);
          const batch = await generateBatch(config.topics, requestCount, config.difficulty, accessToken);
          allQuestions.push(...batch);
          setLoadingPercent(70);

          if (allQuestions.length < config.count) {
            setLoadingProgress(`Complementando... (${allQuestions.length}/${config.count})`);
            setLoadingPercent(80);
            const extra = await generateBatch(
              config.topics,
              Math.min(config.count - allQuestions.length + 2, BATCH_SIZE),
              config.difficulty,
              accessToken,
            );
            allQuestions.push(...extra);
          }
        } else {
          const batchCount = Math.ceil(requestCount / BATCH_SIZE);
          const batchSizes = Array.from({ length: batchCount }, (_, i) => {
            const remaining = requestCount - i * BATCH_SIZE;
            return Math.min(BATCH_SIZE, remaining);
          });

          let completedBatches = 0;
          const results = await Promise.allSettled(
            batchSizes.map(async (size) => {
              const result = await generateBatch(config.topics, size, config.difficulty, accessToken);
              completedBatches++;
              const pct = 25 + Math.round((completedBatches / batchCount) * 55);
              setLoadingPercent(pct);
              setLoadingProgress(`Gerando lote ${completedBatches}/${batchCount}...`);
              return result;
            }),
          );

          for (const result of results) {
            if (result.status === "fulfilled") {
              allQuestions.push(...result.value);
            }
          }

          if (allQuestions.length < config.count) {
            setLoadingProgress(`Complementando... (${allQuestions.length}/${config.count})`);
            setLoadingPercent(85);
            try {
              const retry = await generateBatch(
                config.topics,
                Math.min(config.count - allQuestions.length + 2, BATCH_SIZE),
                config.difficulty,
                accessToken,
              );
              allQuestions.push(...retry);
            } catch {
              // accept partial
            }
          }
        }
      }

      setLoadingPercent(90);
      setLoadingProgress("Validando e filtrando questões...");

      // Deduplicate
      allQuestions = deduplicateQuestions(allQuestions);

      if (allQuestions.length === 0) {
        toast({ title: "Erro ao gerar questões. Tente novamente.", variant: "destructive" });
        setPhase("setup");
        return;
      }

      const finalQuestions = allQuestions.slice(0, config.count);

      // If we got significantly fewer than requested, offer partial
      if (finalQuestions.length < config.count && finalQuestions.length < config.count * 0.8) {
        setQuestions(finalQuestions);
        setPartialCount(finalQuestions.length);
        setPhase("partial");
        return;
      }

      setLoadingPercent(100);
      startExamWithQuestions(finalQuestions, config);
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
        if (isCorrect) {
          areaResults[q.topic].correct++;
          correctCount++;
        }
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

      // Salva tentativas para o anti-repetição entre sessões
      const practiceRows = questions
        .map((q, i) => {
          if (!q.bankId) return null;
          return {
            user_id: user.id,
            question_id: q.bankId,
            correct: answers[i] === q.correct,
          };
        })
        .filter(Boolean);

      if (practiceRows.length > 0) {
        const { error: attemptsError } = await supabase.from("practice_attempts").insert(practiceRows as any[]);
        if (attemptsError) {
          console.error("Erro ao salvar tentativas do simulado:", attemptsError);
        }
      }

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
        onDiscardSession={abandonSession}
        onRetryErrors={handleRetryErrors}
        pendingSession={pendingSession}
        checkedSession={checked}
        userId={user?.id}
      />
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">{loadingProgress || "Gerando questões..."}</p>
        <div className="w-64">
          <Progress value={loadingPercent} className="h-2" />
        </div>
        <p className="text-xs text-muted-foreground">{loadingPercent}% concluído</p>
      </div>
    );
  }

  if (phase === "partial") {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in gap-4 max-w-md mx-auto text-center">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-semibold text-foreground">Geração parcial</h2>
        <p className="text-muted-foreground">
          Foram geradas <strong>{partialCount}</strong> de <strong>{targetCount}</strong> questões solicitadas.
          Deseja continuar com as questões disponíveis?
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleNewSimulado}>Cancelar</Button>
          <Button onClick={handleAcceptPartial}>Continuar com {partialCount} questões</Button>
        </div>
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
