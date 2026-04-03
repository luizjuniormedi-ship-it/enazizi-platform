import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { isMedicalContent } from "@/lib/medicalValidation";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import ResumeSessionBanner from "@/components/layout/ResumeSessionBanner";
import { logErrorToBank } from "@/lib/errorBankLogger";
import { updateDomainMap } from "@/lib/updateDomainMap";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import { useFsrs, Rating } from "@/hooks/useFsrs";
import {
  FlipVertical, Loader2, Brain, GraduationCap, Filter,
  Download, Zap, Clock, Award, Maximize2, Minimize2,
  MoreVertical, HelpCircle, ArrowLeft, Search, DatabaseZap,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ModuleHelpButton from "@/components/layout/ModuleHelpButton";
import ModuleEmptyState from "@/components/layout/ModuleEmptyState";
import { exportToPdf } from "@/lib/exportPdf";
import { useNavigate } from "react-router-dom";
import { useStudyContext } from "@/lib/studyContext";
import StudyContextBanner from "@/components/study/StudyContextBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { createPortal } from "react-dom";
import FlashcardExam, { type FlashcardItem } from "@/components/flashcards/FlashcardExam";

type Phase = "setup" | "active" | "finished";

interface FsrsReviewState {
  due: string;
  stability: number;
  state: number;
}

const Flashcards = () => {
  const navigate = useNavigate();
  const studyCtx = useStudyContext();
  const [allCards, setAllCards] = useState<FlashcardItem[]>([]);
  const [dueCards, setDueCards] = useState<FlashcardItem[]>([]);
  const [fsrsStates, setFsrsStates] = useState<Map<string, FsrsReviewState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<"due" | "all" | "sprint">("due");
  const [topicSearch, setTopicSearch] = useState(studyCtx?.topic || "");
  const [generatingFromBank, setGeneratingFromBank] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { addXp } = useGamification();

  // Sprint
  const [sprintConfig] = useState({ cardCount: 10, timeMinutes: 5 });
  const [sprintTimeLeft, setSprintTimeLeft] = useState(0);
  const sprintTimerRef = useRef<NodeJS.Timeout>();

  // Session result
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, skipped: 0 });

  const {
    pendingSession, checked: sessionChecked, saveSession: persistSession,
    completeSession, abandonSession, registerAutoSave, clearPending,
  } = useSessionPersistence({ moduleKey: "flashcards" });

  useEffect(() => {
    registerAutoSave(() => {
      if (allCards.length === 0) return {};
      return { mode, topicSearch, phase };
    });
  }, [registerAutoSave, mode, topicSearch, allCards.length, phase]);

  const handleRestoreSession = () => {
    if (!pendingSession) return;
    const data = pendingSession.session_data as any;
    if (data.mode) setMode(data.mode);
    if (data.topicSearch) setTopicSearch(data.topicSearch);
    clearPending();
  };

  const { review: fsrsReview, getDueCards: getFsrsDue } = useFsrs();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [ownRes, globalRes, fsrsRes] = await Promise.all([
      supabase.from("flashcards").select("id, question, answer, topic, is_global, user_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10000),
      supabase.from("flashcards").select("id, question, answer, topic, is_global, user_id").eq("is_global", true).neq("user_id", user.id).order("created_at", { ascending: false }).limit(10000),
      supabase.from("fsrs_cards").select("card_ref_id, due, stability, state").eq("user_id", user.id).eq("card_type", "flashcard"),
    ]);
    const ownCards = ownRes.data || [];
    const globalCards = globalRes.data || [];
    const ownIds = new Set(ownCards.map(c => c.id));
    const merged = [...ownCards, ...globalCards.filter(c => !ownIds.has(c.id))]
      .filter(c => isMedicalContent(`${c.question} ${c.answer}`));
    setAllCards(merged);

    const stateMap = new Map<string, FsrsReviewState>();
    (fsrsRes.data || []).forEach((r: any) => stateMap.set(r.card_ref_id, { due: r.due, stability: r.stability, state: r.state }));
    setFsrsStates(stateMap);

    const now = new Date().toISOString();
    const due = merged.filter((c) => {
      const fsrs = stateMap.get(c.id);
      return !fsrs || fsrs.due <= now;
    });
    setDueCards(due);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const availableTopics = useMemo(() => {
    const topics = new Set<string>();
    allCards.forEach(c => { if (c.topic) topics.add(c.topic); });
    return Array.from(topics).sort();
  }, [allCards]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic); else next.add(topic);
      return next;
    });
  };

  const filteredCards = useMemo(() => {
    const base = mode === "due" ? dueCards : allCards;
    let result = selectedTopics.size === 0 ? base : base.filter(c => c.topic && selectedTopics.has(c.topic));
    if (mode === "sprint") result = result.slice(0, sprintConfig.cardCount);
    return result;
  }, [mode, dueCards, allCards, selectedTopics, sprintConfig.cardCount]);

  // Sprint timer
  useEffect(() => {
    if (phase !== "active" || mode !== "sprint" || sprintTimeLeft <= 0) return;
    sprintTimerRef.current = setInterval(() => {
      setSprintTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(sprintTimerRef.current);
          setPhase("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(sprintTimerRef.current);
  }, [phase, mode, sprintTimeLeft > 0]);

  const handleStartSession = (selectedMode: "due" | "all" | "sprint") => {
    setMode(selectedMode);
    if (selectedMode === "sprint") {
      setSprintTimeLeft(sprintConfig.timeMinutes * 60);
    }
    setSessionStats({ correct: 0, wrong: 0, skipped: 0 });
    setPhase("active");
  };

  const handleReview = async (cardId: string, rating: Rating, userAnswer: string) => {
    if (!user) return;
    const card = allCards.find(c => c.id === cardId);
    if (!card) return;

    const updatedCard = await fsrsReview("flashcard", cardId, rating);
    const scheduledDays = Math.round(updatedCard.scheduled_days);
    const isCorrect = rating !== Rating.Again;

    await addXp(isCorrect ? XP_REWARDS.question_correct : XP_REWARDS.question_answered);
    if (card.topic) {
      await updateDomainMap(user.id, [{ topic: card.topic, correct: isCorrect }]);
    }
    if (rating === Rating.Again && card.topic) {
      await logErrorToBank({
        userId: user.id,
        tema: card.topic || "Flashcard",
        tipoQuestao: "flashcard",
        conteudo: card.question,
        motivoErro: `Resposta do aluno: "${userAnswer}" — Resposta correta: "${card.answer}"`,
        categoriaErro: "conceito",
      });
    }

    const labels: Record<string, string> = {
      [Rating.Again]: "Revisar em breve",
      [Rating.Good]: scheduledDays > 0 ? `Próxima em ${scheduledDays} dias` : "Revisar em breve",
      [Rating.Easy]: scheduledDays > 0 ? `Próxima em ${scheduledDays} dias` : "Revisar em breve",
    };
    toast({ title: labels[rating] || "Revisado" });
  };

  const handleDelete = async (cardId: string) => {
    await supabase.from("flashcards").delete().eq("id", cardId);
    setAllCards(prev => prev.filter(c => c.id !== cardId));
    setDueCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleFinish = (stats: { correct: number; wrong: number; skipped: number }) => {
    clearInterval(sprintTimerRef.current);
    setSessionStats(stats);
    setPhase("finished");
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // ── Empty state ──
  if (allCards.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FlipVertical className="h-6 w-6 text-primary" /> Flashcards
            </h1>
            <p className="text-muted-foreground">Revise seus flashcards com repetição espaçada.</p>
          </div>
          <ModuleHelpButton moduleKey="flashcards" moduleName="Flashcards" steps={[
            "Vá em 'Gerar Flashcards' no menu lateral para criar cards com IA por tema",
            "Cada card tem frente (pergunta) e verso (resposta) — clique para virar",
            "Após virar, avalie: Fácil, Bom ou Errei — o algoritmo agenda revisões",
            "Use o modo Sprint ⚡ para revisar vários cards com cronômetro",
          ]} />
        </div>
        <ModuleEmptyState
          icon="📚"
          title="Nenhum flashcard ainda"
          description="Gere flashcards com IA a partir de qualquer tema médico ou envie um PDF."
          steps={["Vá em 'Gerar Flashcards' e escolha um tema", "A IA cria flashcards com casos clínicos", "Revise marcando Fácil/Difícil — o algoritmo agenda revisões"]}
          actionLabel="Gerar Flashcards Agora"
          actionPath="/dashboard/flashcard-generator"
        />
      </div>
    );
  }

  const reviewedCount = allCards.length - dueCards.length;

  // ── PHASE: Finished ──
  if (phase === "finished") {
    const total = sessionStats.correct + sessionStats.wrong;
    const rate = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;

    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        <div className="glass-card p-8 text-center space-y-4">
          <Award className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-xl font-bold">
            {mode === "sprint" ? "Sprint Concluído!" : "Sessão Concluída!"}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <div className="text-2xl font-bold text-green-500">{sessionStats.correct}</div>
              <div className="text-xs text-muted-foreground">Acertos</div>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10">
              <div className="text-2xl font-bold text-destructive">{sessionStats.wrong}</div>
              <div className="text-xs text-muted-foreground">Erros</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-muted-foreground">{sessionStats.skipped}</div>
              <div className="text-xs text-muted-foreground">Pulados</div>
            </div>
          </div>
          {total > 0 && (
            <p className="text-sm text-muted-foreground">Taxa de acerto: {rate}%</p>
          )}
          <div className="flex gap-2 justify-center">
            <Button onClick={() => { setPhase("setup"); }}>Nova Sessão</Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: Active ──
  if (phase === "active") {
    if (filteredCards.length === 0) {
      return (
        <div className="max-w-xl mx-auto glass-card p-12 text-center animate-fade-in">
          <p className="text-lg font-medium mb-2">Nenhum flashcard disponível</p>
          <p className="text-sm text-muted-foreground mb-4">Selecione outros temas ou modo.</p>
          <Button onClick={() => setPhase("setup")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      );
    }

    const content = (
      <div className={isFullscreen ? "fixed inset-0 z-[100] bg-background p-2 sm:p-4 overflow-auto" : ""}>
        <div className="flex justify-end mb-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => setPhase("setup")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Sair
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
        <FlashcardExam
          cards={filteredCards}
          mode={mode}
          sprintTimeLeft={mode === "sprint" ? sprintTimeLeft : undefined}
          onReview={handleReview}
          onFinish={handleFinish}
          onDelete={handleDelete}
          userId={user?.id}
        />
      </div>
    );

    if (isFullscreen) return createPortal(content, document.body);
    return content;
  }

  // ── PHASE: Setup ──
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {pendingSession && (
        <ResumeSessionBanner
          updatedAt={pendingSession.updated_at}
          onResume={handleRestoreSession}
          onDiscard={abandonSession}
        />
      )}
      <StudyContextBanner />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FlipVertical className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Flashcards
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {allCards.length} total • {dueCards.length} para revisar • {reviewedCount} em dia
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <ModuleHelpButton moduleKey="flashcards" moduleName="Flashcards" steps={[
            "Escolha um modo de revisão e inicie a sessão",
            "Responda cada card e avalie seu desempenho",
            "O algoritmo FSRS agenda revisões automáticas",
          ]} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => exportToPdf(
                  allCards.map(c => ({ title: c.question, content: c.answer, subtitle: c.topic || undefined })),
                  "Flashcards_ENAZIZI"
                )}
              >
                <Download className="h-4 w-4 mr-2" /> Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* FSRS Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Novos", count: Array.from(fsrsStates.values()).filter(s => s.state === 0).length },
          { label: "Aprendendo", count: Array.from(fsrsStates.values()).filter(s => s.state === 1 || s.state === 3).length },
          { label: "Revisão", count: Array.from(fsrsStates.values()).filter(s => s.state === 2).length },
          { label: "Total", count: allCards.length },
        ].map(({ label, count }) => (
          <div key={label} className="glass-card p-3 text-center">
            <div className="text-lg font-bold text-primary">{count}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Topic filter */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtrar por especialidade
          </h3>
          {selectedTopics.size > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedTopics(new Set())}>
              Limpar filtros
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableTopics.map(topic => (
            <Badge
              key={topic}
              variant={selectedTopics.has(topic) ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => toggleTopic(topic)}
            >
              {topic}
              <span className="ml-1 text-xs opacity-70">
                ({allCards.filter(c => c.topic === topic).length})
              </span>
            </Badge>
          ))}
          {availableTopics.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum tema disponível</p>
          )}
        </div>
      </div>

      {/* Mode selection */}
      <div className="grid gap-3">
        <button
          onClick={() => handleStartSession("due")}
          className="glass-card p-5 text-left hover:border-primary/40 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Revisão Inteligente</h3>
              <p className="text-xs text-muted-foreground">
                {dueCards.length} cards pendentes — prioridade por risco de esquecimento
              </p>
            </div>
            <Badge variant="secondary">{dueCards.length}</Badge>
          </div>
        </button>

        <button
          onClick={() => handleStartSession("all")}
          className="glass-card p-5 text-left hover:border-primary/40 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Todos os Cards</h3>
              <p className="text-xs text-muted-foreground">
                Revise todos os flashcards disponíveis
              </p>
            </div>
            <Badge variant="secondary">{allCards.length}</Badge>
          </div>
        </button>

        <button
          onClick={() => handleStartSession("sprint")}
          className="glass-card p-5 text-left hover:border-primary/40 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Modo Sprint</h3>
              <p className="text-xs text-muted-foreground">
                {sprintConfig.cardCount} cards em {sprintConfig.timeMinutes} minutos — velocidade máxima
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {sprintConfig.timeMinutes}min
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Flashcards;
