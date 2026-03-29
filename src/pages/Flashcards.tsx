import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { isMedicalContent } from "@/lib/medicalValidation";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import ResumeSessionBanner from "@/components/layout/ResumeSessionBanner";
import { createPortal } from "react-dom";
import { logErrorToBank } from "@/lib/errorBankLogger";
import { updateDomainMap } from "@/lib/updateDomainMap";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import { useFsrs, Rating } from "@/hooks/useFsrs";
import { FlipVertical, RotateCcw, ChevronLeft, ChevronRight, Loader2, X, Brain, CalendarDays, Send, CheckCircle, XCircle, GraduationCap, Filter, Download, Zap, Clock, Award, Maximize2, Minimize2, MoreVertical, HelpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ModuleHelpButton from "@/components/layout/ModuleHelpButton";
import ModuleEmptyState from "@/components/layout/ModuleEmptyState";
import { exportToPdf } from "@/lib/exportPdf";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string | null;
  is_global?: boolean;
  user_id?: string;
}

interface Review {
  id: string;
  flashcard_id: string;
  interval_days: number;
  next_review: string;
}

const INTERVALS = [1, 3, 7, 14, 30];

const Flashcards = () => {
  const navigate = useNavigate();
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<Map<string, Review>>(new Map());
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [mode, setMode] = useState<"due" | "all" | "sprint">("due");
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [showTopicFilter, setShowTopicFilter] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { addXp } = useGamification();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    pendingSession, checked: sessionChecked, saveSession: persistSession,
    completeSession, abandonSession, registerAutoSave, clearPending,
  } = useSessionPersistence({ moduleKey: "flashcards" });

  // Register auto-save
  useEffect(() => {
    registerAutoSave(() => {
      if (allCards.length === 0) return {};
      return { idx, mode, flipped, selectedTopics: Array.from(selectedTopics) };
    });
  }, [registerAutoSave, idx, mode, flipped, selectedTopics, allCards.length]);

  const handleRestoreSession = () => {
    if (!pendingSession) return;
    const data = pendingSession.session_data as any;
    if (data.idx != null) setIdx(data.idx);
    if (data.mode) setMode(data.mode);
    if (data.selectedTopics) setSelectedTopics(new Set(data.selectedTopics));
    clearPending();
  };

  // Sprint mode state
  const [sprintConfig, setSprintConfig] = useState({ cardCount: 10, timeMinutes: 5 });
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintTimeLeft, setSprintTimeLeft] = useState(0);
  const [sprintStats, setSprintStats] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [sprintFinished, setSprintFinished] = useState(false);
  const sprintTimerRef = useRef<NodeJS.Timeout>();
  const sprintStartRef = useRef<Date>();

  // Sprint timer
  useEffect(() => {
    if (!sprintActive || sprintTimeLeft <= 0) return;
    sprintTimerRef.current = setInterval(() => {
      setSprintTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(sprintTimerRef.current);
          setSprintActive(false);
          setSprintFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(sprintTimerRef.current);
  }, [sprintActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const startSprint = () => {
    const cards = filteredCards.slice(0, sprintConfig.cardCount);
    if (cards.length === 0) {
      toast({ title: "Nenhum flashcard disponível para sprint", variant: "destructive" });
      return;
    }
    setIdx(0);
    setFlipped(false);
    setUserAnswer("");
    setAnswerSubmitted(false);
    setSprintStats({ correct: 0, wrong: 0, skipped: 0 });
    setSprintTimeLeft(sprintConfig.timeMinutes * 60);
    setSprintActive(true);
    setSprintFinished(false);
    sprintStartRef.current = new Date();
    setMode("sprint");
  };

  const endSprint = () => {
    clearInterval(sprintTimerRef.current);
    setSprintActive(false);
    setSprintFinished(true);
  };

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch own cards + global cards in parallel
    const [ownRes, globalRes, reviewsRes] = await Promise.all([
      supabase.from("flashcards").select("id, question, answer, topic, is_global, user_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10000),
      supabase.from("flashcards").select("id, question, answer, topic, is_global, user_id").eq("is_global", true).neq("user_id", user.id).order("created_at", { ascending: false }).limit(10000),
      supabase.from("reviews").select("id, flashcard_id, interval_days, next_review").eq("user_id", user.id),
    ]);

    // Merge and deduplicate
    const ownCards = ownRes.data || [];
    const globalCards = globalRes.data || [];
    const ownIds = new Set(ownCards.map(c => c.id));
     const merged = [...ownCards, ...globalCards.filter(c => !ownIds.has(c.id))]
      .filter(c => isMedicalContent(`${c.question} ${c.answer}`));

    setAllCards(merged);

    const reviewMap = new Map<string, Review>();
    (reviewsRes.data || []).forEach((r) => reviewMap.set(r.flashcard_id, r));
    setReviews(reviewMap);

    const now = new Date().toISOString();
    const due = merged.filter((c) => {
      const review = reviewMap.get(c.id);
      return !review || review.next_review <= now;
    });
    setDueCards(due);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Extract unique topics
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
    setIdx(0);
    setFlipped(false);
    setUserAnswer("");
    setAnswerSubmitted(false);
  };

  const filteredCards = useMemo(() => {
    const base = mode === "due" ? dueCards : allCards;
    if (selectedTopics.size === 0) return base;
    return base.filter(c => c.topic && selectedTopics.has(c.topic));
  }, [mode, dueCards, allCards, selectedTopics]);

  const card = filteredCards[idx];

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) return;
    setAnswerSubmitted(true);
    setFlipped(true);
  };

  const isAnswerCorrect = useCallback(() => {
    if (!card || !userAnswer.trim()) return false;
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
    const userNorm = normalize(userAnswer);
    const answerNorm = normalize(card.answer);
    const answerWords = answerNorm.split(/\s+/).filter(w => w.length > 3);
    if (answerWords.length === 0) return userNorm === answerNorm;
    const matchCount = answerWords.filter(w => userNorm.includes(w)).length;
    return matchCount / answerWords.length >= 0.4;
  }, [card, userAnswer]);

  const handleReview = async (quality: "again" | "good" | "easy") => {
    if (!user || !card) return;

    const existing = reviews.get(card.id);
    const currentInterval = existing?.interval_days || 0;

    let newInterval: number;
    if (quality === "again") {
      newInterval = 1;
    } else if (quality === "good") {
      const currentIdx = INTERVALS.indexOf(currentInterval);
      newInterval = INTERVALS[Math.min(currentIdx + 1, INTERVALS.length - 1)] || INTERVALS[1];
    } else {
      const currentIdx = INTERVALS.indexOf(currentInterval);
      newInterval = INTERVALS[Math.min(currentIdx + 2, INTERVALS.length - 1)] || INTERVALS[INTERVALS.length - 1];
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    if (existing) {
      await supabase.from("reviews").update({
        interval_days: newInterval,
        next_review: nextReview.toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("reviews").insert({
        user_id: user.id,
        flashcard_id: card.id,
        interval_days: newInterval,
        next_review: nextReview.toISOString(),
      });
    }

    // Award XP for flashcard review
    const isCorrect = quality !== "again";
    await addXp(isCorrect ? XP_REWARDS.question_correct : XP_REWARDS.question_answered);

    // Update medical domain map
    if (card.topic) {
      await updateDomainMap(user.id, [{ topic: card.topic, correct: isCorrect }]);
    }

    // Log error to error_bank if wrong
    if (quality === "again" && card.topic) {
      await logErrorToBank({
        userId: user.id,
        tema: card.topic || "Flashcard",
        tipoQuestao: "flashcard",
        conteudo: card.question,
        motivoErro: `Resposta do aluno: "${userAnswer}" — Resposta correta: "${card.answer}"`,
        categoriaErro: "conceito",
      });
    }

    // Track sprint stats
    if (sprintActive) {
      if (quality === "again") {
        setSprintStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      } else {
        setSprintStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      }
      // Move to next or end sprint
      if (idx + 1 >= Math.min(sprintConfig.cardCount, filteredCards.length)) {
        endSprint();
      } else {
        setIdx(idx + 1);
      }
    } else if (mode === "due") {
      const newDue = dueCards.filter((c) => c.id !== card.id);
      setDueCards(newDue);
      setIdx(Math.min(idx, Math.max(0, newDue.length - 1)));
    } else {
      setIdx(Math.min(idx + 1, filteredCards.length - 1));
    }
    setFlipped(false);
    setUserAnswer("");
    setAnswerSubmitted(false);

    const labels = { again: "Revisar amanhã", good: `Próxima em ${newInterval} dias`, easy: `Próxima em ${newInterval} dias` };
    toast({ title: labels[quality] });
  };

  const handleDelete = async () => {
    if (!card) return;
    await supabase.from("flashcards").delete().eq("id", card.id);
    setAllCards((prev) => prev.filter((c) => c.id !== card.id));
    setDueCards((prev) => prev.filter((c) => c.id !== card.id));
    setIdx(Math.min(idx, Math.max(0, filteredCards.length - 2)));
    setFlipped(false);
    setUserAnswer("");
    setAnswerSubmitted(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (allCards.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FlipVertical className="h-6 w-6 text-primary" />
              Flashcards
            </h1>
            <p className="text-muted-foreground">Revise seus flashcards com repetição espaçada.</p>
          </div>
          <ModuleHelpButton moduleKey="flashcards" moduleName="Flashcards" steps={[
            "Vá em 'Gerar Flashcards' no menu lateral para criar cards com IA por tema",
            "Cada card tem frente (pergunta) e verso (resposta) — clique para virar",
            "Após virar, avalie: Fácil (revê em 7d), Médio (3d) ou Difícil (1d)",
            "O algoritmo de repetição espaçada agenda revisões automáticas",
            "Use o modo Sprint ⚡ para revisar vários cards com cronômetro",
            "Filtre por tema e exporte cards em PDF para estudo offline",
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

  const content = (
    <div className={`animate-fade-in ${isFullscreen ? "fixed inset-0 z-[100] bg-background p-2 sm:p-4 overflow-auto" : "space-y-6"}`}>
      {/* Resume Session Banner */}
      {pendingSession && (
        <ResumeSessionBanner
          updatedAt={pendingSession.updated_at}
          onResume={handleRestoreSession}
          onDiscard={abandonSession}
        />
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FlipVertical className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="truncate">Flashcards</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {allCards.length} total • {dueCards.length} para revisar • {reviewedCount} em dia
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button variant="outline" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} className="h-8 w-8" title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setMode("due"); setIdx(0); setFlipped(false); }}>
                <Brain className="h-4 w-4 mr-2" /> Revisão ({dueCards.length}) {mode === "due" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setMode("all"); setIdx(0); setFlipped(false); setSprintActive(false); setSprintFinished(false); }}>
                <GraduationCap className="h-4 w-4 mr-2" /> Todos ({allCards.length}) {mode === "all" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTopicFilter(!showTopicFilter)}>
                <Filter className="h-4 w-4 mr-2" /> Filtrar temas {selectedTopics.size > 0 && `(${selectedTopics.size})`}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={startSprint}>
                <Zap className="h-4 w-4 mr-2" /> Modo Sprint
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToPdf(
                  filteredCards.map((c) => ({ title: c.question, content: c.answer, subtitle: c.topic || undefined })),
                  "Flashcards_ENAZIZI"
                )}
                disabled={filteredCards.length === 0}
              >
                <Download className="h-4 w-4 mr-2" /> Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <HelpCircle className="h-4 w-4 mr-2" /> Como usar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Topic filter */}
      {showTopicFilter && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Filtrar por especialidade</h3>
            {selectedTopics.size > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setSelectedTopics(new Set()); setIdx(0); }}>
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
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-2">
        {INTERVALS.map((interval) => {
          const count = Array.from(reviews.values()).filter((r) => r.interval_days === interval).length;
          return (
            <div key={interval} className="glass-card p-3 text-center">
              <div className="text-lg font-bold text-primary">{count}</div>
              <div className="text-xs text-muted-foreground">{interval}d</div>
            </div>
          );
        })}
      </div>

      {/* Sprint finished screen */}
      {sprintFinished && (
        <div className="glass-card p-8 text-center space-y-4 animate-fade-in">
          <Award className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-xl font-bold">Sprint Concluído!</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <div className="text-2xl font-bold text-green-500">{sprintStats.correct}</div>
              <div className="text-xs text-muted-foreground">Acertos</div>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10">
              <div className="text-2xl font-bold text-destructive">{sprintStats.wrong}</div>
              <div className="text-xs text-muted-foreground">Erros</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-muted-foreground">{sprintStats.skipped}</div>
              <div className="text-xs text-muted-foreground">Pulados</div>
            </div>
          </div>
          {(sprintStats.correct + sprintStats.wrong) > 0 && (
            <p className="text-sm text-muted-foreground">
              Taxa de acerto: {Math.round((sprintStats.correct / (sprintStats.correct + sprintStats.wrong)) * 100)}%
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <Button onClick={startSprint}>Novo Sprint</Button>
            <Button variant="outline" onClick={() => { setMode("due"); setSprintFinished(false); setIdx(0); }}>Voltar</Button>
          </div>
        </div>
      )}

      {/* Sprint timer */}
      {sprintActive && (
        <div className="flex items-center justify-between glass-card p-3">
          <span className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Modo Sprint
          </span>
          <span className={`font-mono font-bold ${sprintTimeLeft < 30 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>
            <Clock className="h-4 w-4 inline mr-1" />{formatTime(sprintTimeLeft)}
          </span>
          <span className="text-xs text-muted-foreground">
            ✅ {sprintStats.correct} ❌ {sprintStats.wrong}
          </span>
          <Button variant="outline" size="sm" onClick={endSprint}>Encerrar</Button>
        </div>
      )}

      {!sprintFinished && filteredCards.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CalendarDays className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">
            {selectedTopics.size > 0 ? "Nenhum flashcard neste tema" : "Tudo em dia! 🎉"}
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedTopics.size > 0 ? "Selecione outros temas ou limpe o filtro." : "Nenhum flashcard para revisar agora. Volte mais tarde."}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center">
            <div className="glass-card w-full max-w-2xl min-h-[320px] p-8 flex flex-col items-center justify-center text-center relative group transition-all">
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="text-xs text-primary/70 font-medium px-2 py-1 rounded-md bg-primary/10">
                  {card.topic || "Geral"}
                </span>
                {card.is_global && card.user_id !== user?.id && (
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted">🌐 Global</span>
                )}
              </div>
              <div className="absolute top-4 right-4 text-xs text-muted-foreground">
                {idx + 1}/{filteredCards.length}
              </div>
              {reviews.get(card.id) && (
                <div className="absolute bottom-4 left-4 text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Intervalo: {reviews.get(card.id)!.interval_days}d
                </div>
              )}

              <div className="text-xs uppercase tracking-wider text-primary mb-4 font-semibold">
                Pergunta
              </div>
              <p className="text-lg leading-relaxed mb-6">{card.question}</p>

              {flipped && (
                <div className={`w-full border-t border-border pt-4 mt-2 rounded-b-lg ${answerSubmitted ? (isAnswerCorrect() ? "bg-success/5" : "bg-destructive/5") : ""}`}>
                  <div className="text-xs uppercase tracking-wider text-primary mb-2 font-semibold flex items-center justify-center gap-2">
                    Resposta
                    {answerSubmitted && (
                      isAnswerCorrect()
                        ? <CheckCircle className="h-4 w-4 text-success" />
                        : <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  {answerSubmitted && (
                    <div className="mb-3 p-2 rounded-md bg-muted/50 text-sm">
                      <span className="text-muted-foreground">Sua resposta: </span>
                      <span className={isAnswerCorrect() ? "text-success font-medium" : "text-destructive font-medium"}>
                        {userAnswer}
                      </span>
                    </div>
                  )}
                  <p className="text-lg leading-relaxed font-medium">{card.answer}</p>
                </div>
              )}
            </div>
          </div>

          {!flipped && (
            <div className="flex items-center justify-center gap-2 max-w-2xl mx-auto w-full">
              <Button variant="outline" size="icon" onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); setUserAnswer(""); setAnswerSubmitted(false); }} disabled={idx === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitAnswer(); }} className="flex-1 flex gap-2">
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Digite sua resposta..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!userAnswer.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Responder
                </Button>
              </form>
              <Button variant="ghost" size="sm" onClick={() => { setFlipped(true); setAnswerSubmitted(false); }} className="text-muted-foreground text-xs">
                Pular
              </Button>
              <Button variant="outline" size="icon" onClick={() => { setIdx(Math.min(filteredCards.length - 1, idx + 1)); setFlipped(false); setUserAnswer(""); setAnswerSubmitted(false); }} disabled={idx === filteredCards.length - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {flipped && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button variant="destructive" onClick={() => handleReview("again")} className="min-w-[100px]">
                <RotateCcw className="h-4 w-4 mr-2" />
                Errei (1d)
              </Button>
              <Button variant="outline" onClick={() => handleReview("good")} className="min-w-[100px]">
                Bom
              </Button>
              <Button className="bg-success hover:bg-success/90 min-w-[100px]" onClick={() => handleReview("easy")}>
                Fácil
              </Button>
              {card.user_id === user?.id && (
                <Button variant="ghost" size="icon" title="Remover" onClick={handleDelete}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              {answerSubmitted && !isAnswerCorrect() && card.topic && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => navigate("/dashboard/chatgpt", {
                    state: {
                      initialMessage: `Errei um flashcard sobre "${card.topic}". A pergunta era: "${card.question}". A resposta correta era: "${card.answer}". Me explique este tema seguindo o protocolo ENAZIZI.`,
                      fromErrorBank: true,
                    },
                  })}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Aprofundar no Tutor IA
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isFullscreen) return createPortal(content, document.body);
  return content;
};

export default Flashcards;
