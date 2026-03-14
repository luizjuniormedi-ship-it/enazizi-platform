import { useState, useEffect, useCallback } from "react";
import { FlipVertical, RotateCcw, ChevronLeft, ChevronRight, Loader2, X, Brain, CalendarDays, Send, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string | null;
}

interface Review {
  id: string;
  flashcard_id: string;
  interval_days: number;
  next_review: string;
}

const INTERVALS = [1, 3, 7, 14, 30];

const Flashcards = () => {
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<Map<string, Review>>(new Map());
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [mode, setMode] = useState<"due" | "all">("due");
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [cardsRes, reviewsRes] = await Promise.all([
      supabase.from("flashcards").select("id, question, answer, topic").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("reviews").select("id, flashcard_id, interval_days, next_review").eq("user_id", user.id),
    ]);

    const cards = cardsRes.data || [];
    setAllCards(cards);

    const reviewMap = new Map<string, Review>();
    (reviewsRes.data || []).forEach((r) => reviewMap.set(r.flashcard_id, r));
    setReviews(reviewMap);

    const now = new Date().toISOString();
    const due = cards.filter((c) => {
      const review = reviewMap.get(c.id);
      return !review || review.next_review <= now;
    });
    setDueCards(due);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentCards = mode === "due" ? dueCards : allCards;
  const card = currentCards[idx];

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
    // Check if user answer contains key words from the correct answer (at least 40% match)
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

    // Log error to error_bank if wrong
    if (quality === "again" && card.topic) {
      await supabase.from("error_bank").upsert({
        user_id: user.id,
        tema: card.topic || "Flashcard",
        tipo_questao: "flashcard",
        conteudo: card.question,
        motivo_erro: `Resposta do aluno: "${userAnswer}" — Resposta correta: "${card.answer}"`,
        categoria_erro: "conceito",
        vezes_errado: 1,
      }, { onConflict: "user_id,tema,conteudo" }).select();
    }

    // Remove from due list
    if (mode === "due") {
      const newDue = dueCards.filter((c) => c.id !== card.id);
      setDueCards(newDue);
      setIdx(Math.min(idx, Math.max(0, newDue.length - 1)));
    } else {
      setIdx(Math.min(idx + 1, currentCards.length - 1));
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
    setIdx(Math.min(idx, Math.max(0, currentCards.length - 2)));
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
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlipVertical className="h-6 w-6 text-primary" />
            Flashcards
          </h1>
          <p className="text-muted-foreground">Revise seus flashcards com repetição espaçada.</p>
        </div>
        <div className="glass-card p-12 text-center">
          <FlipVertical className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Nenhum flashcard ainda</p>
          <p className="text-sm text-muted-foreground">Envie um PDF na seção de Uploads para gerar flashcards automaticamente com IA.</p>
        </div>
      </div>
    );
  }

  const reviewedCount = allCards.length - dueCards.length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlipVertical className="h-6 w-6 text-primary" />
            Flashcards
          </h1>
          <p className="text-muted-foreground">
            {allCards.length} total • {dueCards.length} para revisar hoje • {reviewedCount} em dia
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === "due" ? "default" : "outline"} size="sm" onClick={() => { setMode("due"); setIdx(0); setFlipped(false); }}>
            <Brain className="h-4 w-4 mr-2" />
            Revisão ({dueCards.length})
          </Button>
          <Button variant={mode === "all" ? "default" : "outline"} size="sm" onClick={() => { setMode("all"); setIdx(0); setFlipped(false); }}>
            Todos ({allCards.length})
          </Button>
        </div>
      </div>

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

      {currentCards.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CalendarDays className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Tudo em dia! 🎉</p>
          <p className="text-sm text-muted-foreground">Nenhum flashcard para revisar agora. Volte mais tarde.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center">
            <div className="glass-card w-full max-w-2xl min-h-[320px] p-8 flex flex-col items-center justify-center text-center relative group transition-all">
              <div className="absolute top-4 left-4 text-xs text-primary/70 font-medium px-2 py-1 rounded-md bg-primary/10">
                {card.topic || "Geral"}
              </div>
              <div className="absolute top-4 right-4 text-xs text-muted-foreground">
                {idx + 1}/{currentCards.length}
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
              <Button variant="outline" size="icon" onClick={() => { setIdx(Math.min(currentCards.length - 1, idx + 1)); setFlipped(false); setUserAnswer(""); setAnswerSubmitted(false); }} disabled={idx === currentCards.length - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {flipped && (
            <div className="flex items-center justify-center gap-3">
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
              <Button variant="ghost" size="icon" title="Remover" onClick={handleDelete}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Flashcards;
