import { HelpCircle, Zap, BarChart3, Target, Trophy, XCircle, CheckCircle2, RotateCcw } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";
import InteractiveQuestionRenderer from "@/components/agents/InteractiveQuestionRenderer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { parseQuestionsFromText } from "@/lib/parseQuestions";
import { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ALL_SPECIALTIES } from "@/constants/specialties";
import CycleFilter, { getFilteredSpecialties } from "@/components/CycleFilter";

const DIFFICULTY_OPTIONS = [
  { value: "facil", label: "Fácil", emoji: "🟢", desc: "Apresentações típicas" },
  { value: "intermediario", label: "Intermediário", emoji: "🟡", desc: "Padrão REVALIDA" },
  { value: "dificil", label: "Difícil", emoji: "🔴", desc: "Pegadinhas ENARE" },
  { value: "misto", label: "Misto", emoji: "🔀", desc: "50% médio + 50% difícil" },
];

const QUANTITY_OPTIONS = [5, 10, 15, 20];

interface SessionStats {
  total: number;
  correct: number;
  bySpecialty: Record<string, { total: number; correct: number }>;
}

const QuestionGenerator = () => {
  const { user } = useAuth();
  const [specialty, setSpecialty] = useState<string>("");
  const [cycleFilter, setCycleFilter] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState("intermediario");
  const [quantity, setQuantity] = useState(10);
  const [marathonMode, setMarathonMode] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ total: 0, correct: 0, bySpecialty: {} });
  const [showSetup, setShowSetup] = useState(true);
  const marathonAnsweredRef = useRef(0);
  const marathonTotalRef = useRef(0);
  const sendPromptRef = useRef<((prompt: string) => void) | null>(null);
  const initialPromptRef = useRef<string>("");

  // Listen to InteractiveQuestionCard answers via custom event
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { correct, topic } = e.detail;
      setSessionStats(prev => {
        const spec = topic || "Geral";
        const existing = prev.bySpecialty[spec] || { total: 0, correct: 0 };
        return {
          total: prev.total + 1,
          correct: prev.correct + (correct ? 1 : 0),
          bySpecialty: {
            ...prev.bySpecialty,
            [spec]: { total: existing.total + 1, correct: existing.correct + (correct ? 1 : 0) },
          },
        };
      });

      // Marathon mode: auto-generate more when user is near the end
      if (marathonMode) {
        marathonAnsweredRef.current += 1;
        if (marathonAnsweredRef.current >= marathonTotalRef.current - 1) {
          const nextPrompt = `Gere mais 5 questões ORIGINAIS de ${effectiveSpecialty || "qualquer área médica"} nível ${difficulty}. Formato ENARE com casos clínicos variados. NÃO repita cenários anteriores.`;
          marathonTotalRef.current += 5;
          setTimeout(() => sendPromptRef.current?.(nextPrompt), 1500);
        }
      }
    };

    window.addEventListener("question-answered" as any, handler);
    return () => window.removeEventListener("question-answered" as any, handler);
  }, [marathonMode, specialty, difficulty]);

  const effectiveSpecialty = specialty && specialty !== "all" ? specialty : "";

  const buildPrompt = () => {
    const specPart = effectiveSpecialty || "qualquer área médica (variando especialidades)";
    return `Gere ${quantity} questões ORIGINAIS de ${specPart} nível ${difficulty}. Formato ENARE com casos clínicos variados, alternativas plausíveis e explicação detalhada. Varie subtemas, perfis de pacientes e cenários.`;
  };

  const quickActions = showSetup ? [] : [
    { label: "🔄 Gerar mais", prompt: buildPrompt(), icon: "🔄" },
  ];

  const handleSaveQuestions = useCallback(async (content: string): Promise<number> => {
    if (!user) throw new Error("Usuário não autenticado");
    const parsed = parseQuestionsFromText(content);
    if (parsed.length === 0) throw new Error("Nenhuma questão encontrada para salvar.");

    // Track marathon total
    marathonTotalRef.current += parsed.length;

    const rows = parsed.map((q) => ({
      user_id: user.id,
      statement: q.statement,
      options: q.options,
      correct_index: q.correctIndex,
      explanation: q.explanation,
      topic: q.topic || null,
      source: "gerador-ia",
    }));

    const { error } = await supabase.from("questions_bank").insert(rows);
    if (error) throw new Error("Erro ao salvar: " + error.message);
    return parsed.length;
  }, [user]);

  const loadPreviousQuestions = useCallback(async (): Promise<string> => {
    if (!user) return "";
    const { data } = await supabase
      .from("questions_bank")
      .select("statement, topic")
      .eq("user_id", user.id)
      .eq("source", "gerador-ia")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!data || data.length === 0) return "";
    const items = data.map((q, i) => {
      const truncated = q.statement?.slice(0, 80) || "";
      return `${i + 1}. [${q.topic || "Geral"}] ${truncated}`;
    });
    return `⛔ QUESTÕES JÁ GERADAS ANTERIORMENTE (NÃO REPETIR cenários similares — varie diagnóstico, perfil do paciente e abordagem):\n${items.join("\n")}`;
  }, [user]);

  const renderInteractive = useCallback((content: string) => (
    <InteractiveQuestionRenderer content={content} />
  ), []);

  const handleStartGenerating = () => {
    setShowSetup(false);
    marathonAnsweredRef.current = 0;
    marathonTotalRef.current = 0;
    initialPromptRef.current = buildPrompt();
  };


  const handleResetSession = () => {
    setSessionStats({ total: 0, correct: 0, bySpecialty: {} });
    setShowSetup(true);
    marathonAnsweredRef.current = 0;
    marathonTotalRef.current = 0;
  };

  const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;

  // Find best and worst specialty
  const specEntries = Object.entries(sessionStats.bySpecialty);
  const bestSpec = specEntries.length > 0
    ? specEntries.reduce((a, b) => (b[1].correct / b[1].total) > (a[1].correct / a[1].total) ? b : a)
    : null;
  const worstSpec = specEntries.length > 1
    ? specEntries.reduce((a, b) => (b[1].correct / b[1].total) < (a[1].correct / a[1].total) ? b : a)
    : null;

  if (showSetup) {
    return (
      <div className="flex flex-col animate-fade-in h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)]">
        <div className="mb-4">
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Gerador de Questões
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Configure e comece a treinar com questões estilo ENARE, USP e UNIFESP.</p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="glass-card p-6 sm:p-8 max-w-lg w-full space-y-6">
            {/* Specialty */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" />
                Especialidade
              </label>
              <CycleFilter activeCycle={cycleFilter} onCycleChange={setCycleFilter} className="mb-2" />
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas (misto)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">Todas (misto)</SelectItem>
                  {getFilteredSpecialties(cycleFilter).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Dificuldade</label>
              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTY_OPTIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                      difficulty === d.value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <span>{d.emoji}</span>
                    <div className="text-left">
                      <div className="font-medium text-xs">{d.label}</div>
                      <div className="text-[10px] text-muted-foreground">{d.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <div className="flex gap-2">
                {QUANTITY_OPTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      quantity === q
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Marathon mode */}
            <label className="flex items-center gap-3 cursor-pointer px-3 py-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <input
                type="checkbox"
                checked={marathonMode}
                onChange={(e) => setMarathonMode(e.target.checked)}
                className="rounded border-primary text-primary focus:ring-primary h-4 w-4"
              />
              <div className="flex-1">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Modo Maratona
                </div>
                <p className="text-[10px] text-muted-foreground">Gera questões automaticamente conforme você responde</p>
              </div>
            </label>

            {/* Start button */}
            <Button
              className="w-full gap-2 h-12 text-base"
              onClick={handleStartGenerating}
            >
              <HelpCircle className="h-5 w-5" />
              Gerar {quantity} Questões
              {effectiveSpecialty ? ` de ${effectiveSpecialty}` : ""}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)]">
      {/* Session stats bar */}
      {sessionStats.total > 0 && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-card border border-border flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <span>{sessionStats.total} respondidas</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span>{sessionStats.correct} certas</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-red-500" />
            <span>{sessionStats.total - sessionStats.correct} erradas</span>
          </div>
          <Badge variant={accuracy >= 70 ? "default" : "destructive"} className="text-[10px]">
            {accuracy}%
          </Badge>
          {bestSpec && specEntries.length > 1 && (
            <span className="text-muted-foreground hidden sm:inline">
              <Trophy className="h-3 w-3 inline mr-0.5 text-amber-500" />
              Melhor: {bestSpec[0]}
            </span>
          )}
          {worstSpec && worstSpec[0] !== bestSpec?.[0] && (
            <span className="text-muted-foreground hidden sm:inline">
              ⚠️ Revisar: {worstSpec[0]}
            </span>
          )}
          {marathonMode && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Zap className="h-3 w-3 text-amber-500" /> Maratona
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-[10px] gap-1" onClick={handleResetSession}>
            <RotateCcw className="h-3 w-3" /> Nova sessão
          </Button>
        </div>
      )}

      <AgentChat
        title="Gerador de Questões"
        subtitle={`${effectiveSpecialty ? effectiveSpecialty + " • " : ""}${DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.label || "Intermediário"} • ${quantity} questões${marathonMode ? " • 🔥 Maratona" : ""}`}
        icon={<HelpCircle className="h-6 w-6 text-primary" />}
        welcomeMessage={`Gerando ${quantity} questões${effectiveSpecialty ? ` de ${effectiveSpecialty}` : " mistas"} (${DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.label})... Aguarde! 🧠`}
        welcomeMessageWithUploads="📚 Detectei {count} material(is) do seu acervo: {materiais}. Vou usar como base para gerar questões! 👇"
        placeholder="Ex: Gere mais 5 de Cardiologia sobre IAM..."
        functionName="question-generator"
        onSaveMessage={handleSaveQuestions}
        quickActions={quickActions}
        renderAssistantMessage={renderInteractive}
        showUploadButton={true}
        autoPromptAfterUpload="Gere 10 questões originais no formato ENARE baseadas no material que acabei de enviar: {filename}. Use o conteúdo do material como base para criar casos clínicos variados."
        previousContentLoader={loadPreviousQuestions}
        initialPrompt={initialPromptRef.current}
        onSendRef={sendPromptRef}
      />
    </div>
  );
};

export default QuestionGenerator;
