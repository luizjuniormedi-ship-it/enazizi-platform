import { useState, useEffect } from "react";
import { FlipVertical, RotateCcw, ChevronLeft, ChevronRight, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string | null;
}

const Flashcards = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCards = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("flashcards")
        .select("id, question, answer, topic")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setCards(data);
      setLoading(false);
    };
    fetchCards();
  }, [user]);

  const handleDelete = async () => {
    if (!cards[idx]) return;
    await supabase.from("flashcards").delete().eq("id", cards[idx].id);
    const newCards = cards.filter((_, i) => i !== idx);
    setCards(newCards);
    setIdx(Math.min(idx, newCards.length - 1));
    setFlipped(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (cards.length === 0) {
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

  const card = cards[idx];
  const topics = [...new Set(cards.map(c => c.topic).filter(Boolean))];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlipVertical className="h-6 w-6 text-primary" />
          Flashcards
        </h1>
        <p className="text-muted-foreground">
          {cards.length} flashcards • {topics.length} tópicos
        </p>
      </div>

      <div className="flex items-center justify-center">
        <div
          className="glass-card w-full max-w-2xl min-h-[320px] p-8 cursor-pointer flex flex-col items-center justify-center text-center relative group hover:border-primary/30 transition-all"
          onClick={() => setFlipped(!flipped)}
        >
          <div className="absolute top-4 left-4 text-xs text-primary/70 font-medium px-2 py-1 rounded-md bg-primary/10">
            {card.topic || "Geral"}
          </div>
          <div className="absolute top-4 right-4 text-xs text-muted-foreground">
            {idx + 1}/{cards.length} • Clique para virar
          </div>
          <div className="text-xs uppercase tracking-wider text-primary mb-4 font-semibold">
            {flipped ? "Resposta" : "Pergunta"}
          </div>
          <p className="text-lg leading-relaxed">
            {flipped ? card.answer : card.question}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); }} disabled={idx === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setFlipped(false)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="icon" title="Remover" onClick={handleDelete}>
          <X className="h-4 w-4" />
        </Button>
        <Button size="icon" className="bg-success hover:bg-success/90" title="Próximo" onClick={() => { setIdx(Math.min(cards.length - 1, idx + 1)); setFlipped(false); }} disabled={idx === cards.length - 1}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => { setIdx(Math.min(cards.length - 1, idx + 1)); setFlipped(false); }} disabled={idx === cards.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Flashcards;
